import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { destroyCloudinaryAsset } from '@/lib/cloudinary';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const MODEL_BUCKET = 'zhua-product-models';
const MAX_MODEL_BYTES = 50 * 1024 * 1024; // 50MB
const GLB_MAGIC = 0x46546c67; // 'glTF' little-endian
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CLOUDINARY_MODEL_URL_PATTERN =
  /^https:\/\/res\.cloudinary\.com\/[^/]+\/raw\/upload\/(?:v\d+\/)?(.+?)\.glb$/i;

function buildModelPath(productId: string): string {
  return `products/${productId}/model.glb`;
}

function isGlbBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) {
    return false;
  }

  return new DataView(buffer).getUint32(0, true) === GLB_MAGIC;
}

function friendlyStorageError(message: string): string {
  if (/bucket/i.test(message)) {
    return `Storage bucket "${MODEL_BUCKET}" is missing. Run the product 3D models migration first.`;
  }

  return message;
}

// Cloudinary raw assets include the file extension in `public_id`
// (e.g. `zhua/products/models/abc-123.glb`), while the public URL also
// ends in `.glb`. Normalising away the suffix lets us compare the
// API-returned `public_id` against the URL regardless of whether the
// caller kept the extension.
function normalizeModelPublicId(value: string): string {
  let v = value.trim().split('?')[0].split('#')[0];
  try {
    v = decodeURIComponent(v);
  } catch {
    // Keep raw value if decoding fails — regex will still validate shape.
  }
  if (/\.glb$/i.test(v)) {
    v = v.slice(0, -4);
  }
  // Strip surrounding slashes Cloudinary sometimes includes in signatures.
  return v.replace(/^\/+|\/+$/g, '');
}

function extractCloudinaryPublicId(modelUrl: string): string | null {
  const raw = modelUrl.trim().split('?')[0];
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // Keep raw value if decoding fails — regex will still validate shape.
  }
  const match = CLOUDINARY_MODEL_URL_PATTERN.exec(decoded);
  if (!match) {
    return null;
  }
  const publicId = normalizeModelPublicId(match[1]);
  if (!publicId || publicId.includes('..')) {
    return null;
  }
  return publicId;
}

function isCloudinaryUrl(value: string): boolean {
  return /^https:\/\/res\.cloudinary\.com\//i.test(value);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (!product) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  const contentType = request.headers.get('content-type') ?? '';

  // Primary flow (bypasses the 1MB Next.js Server Actions body limit):
  // browser uploads the .glb DIRECTLY to Cloudinary (resource_type=raw),
  // then posts the returned secure_url here to persist it — exactly like
  // product images (browser -> /api/admin/media/sign-upload -> Cloudinary
  // -> POST /api/admin/products/[id]/model as JSON).
  if (contentType.includes('application/json')) {
    let payload: {
      modelUrl?: string;
      publicId?: string;
      bytes?: number;
      format?: string;
    } | null = null;
    try {
      payload = (await request.json()) as {
        modelUrl?: string;
        publicId?: string;
        bytes?: number;
        format?: string;
      };
    } catch {
      return NextResponse.json({ error: 'Invalid upload payload.' }, { status: 400 });
    }

    const modelUrl = typeof payload?.modelUrl === 'string' ? payload.modelUrl.trim() : '';
    const publicId = typeof payload?.publicId === 'string' ? payload.publicId.trim() : '';
    const bytes = typeof payload?.bytes === 'number' ? payload.bytes : undefined;
    const format = typeof payload?.format === 'string' ? payload.format.trim().toLowerCase() : '';

    if (!modelUrl || !publicId) {
      return NextResponse.json({ error: 'A GLB file is required.' }, { status: 400 });
    }

    if (!isCloudinaryUrl(modelUrl)) {
      return NextResponse.json(
        { error: 'Model must be a Cloudinary raw URL.' },
        { status: 400 }
      );
    }

    const extractedPublicId = extractCloudinaryPublicId(modelUrl);
    const normalizedPublicId = normalizeModelPublicId(publicId);
    if (!extractedPublicId || extractedPublicId !== normalizedPublicId) {
      return NextResponse.json(
        { error: 'Model URL does not match the uploaded asset.' },
        { status: 400 }
      );
    }

    if (!normalizedPublicId.startsWith('zhua/products') || normalizedPublicId.includes('..')) {
      return NextResponse.json({ error: 'Invalid model asset.' }, { status: 400 });
    }

    if (format && format !== 'glb') {
      return NextResponse.json(
        { error: 'Only .glb model files are allowed.' },
        { status: 400 }
      );
    }

    if (typeof bytes === 'number' && (bytes <= 0 || bytes > MAX_MODEL_BYTES)) {
      return NextResponse.json(
        { error: 'Model files must be between 1 byte and 50MB.' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ model_url: modelUrl })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ modelUrl });
  }

  // Legacy flow: multipart FormData file upload. Kept for backward
  // compatibility; next.config.ts now sets serverActions.bodySizeLimit
  // and proxyClientMaxBodySize to 60mb so the 50MB file is not rejected
  // with a 413 "Body exceeded 1 MB limit".
  let file: File | null = null;
  try {
    const formData = await request.formData();
    const entry = formData.get('file');
    if (entry instanceof File) {
      file = entry;
    }
  } catch {
    return NextResponse.json({ error: 'Invalid upload payload.' }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: 'A GLB file is required.' }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith('.glb')) {
    return NextResponse.json({ error: 'Only .glb model files are allowed.' }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_MODEL_BYTES) {
    return NextResponse.json(
      { error: 'Model files must be between 1 byte and 50MB.' },
      { status: 400 }
    );
  }

  const buffer = await file.arrayBuffer();
  if (!isGlbBuffer(buffer)) {
    return NextResponse.json(
      { error: 'That file is not a valid GLB model (missing glTF header).' },
      { status: 400 }
    );
  }

  const path = buildModelPath(id);
  const { error: uploadError } = await supabase.storage
    .from(MODEL_BUCKET)
    .upload(path, buffer, {
      contentType: 'model/gltf-binary',
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: friendlyStorageError(uploadError.message) },
      { status: 500 }
    );
  }

  const { data: publicData } = supabase.storage.from(MODEL_BUCKET).getPublicUrl(path);
  const publicUrl = publicData?.publicUrl;
  if (!publicUrl) {
    return NextResponse.json(
      { error: 'Could not resolve the public model URL.' },
      { status: 500 }
    );
  }

  // Query string busts browser/CDN caches when a model is replaced in place.
  const modelUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from('products')
    .update({ model_url: modelUrl })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ modelUrl });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: existing } = await supabase
    .from('products')
    .select('model_url')
    .eq('id', id)
    .maybeSingle();

  const previousModelUrl =
    typeof existing?.model_url === 'string' ? existing.model_url : '';

  // Cloudinary raw delete (new uploads). Legacy Supabase files are removed below.
  if (previousModelUrl && isCloudinaryUrl(previousModelUrl)) {
    const publicId = extractCloudinaryPublicId(previousModelUrl);
    if (publicId) {
      try {
        // extractCloudinaryPublicId normalises away the `.glb` suffix for
        // URL comparison, but Cloudinary's raw destroy expects it in the
        // public_id (e.g. `zhua/products/models/abc-123.glb`).
        const destroyPublicId = /\.glb$/i.test(publicId) ? publicId : `${publicId}.glb`;
        await destroyCloudinaryAsset(destroyPublicId, 'raw');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Cloudinary delete request failed.';
        if (!/not found|does not exist/i.test(message)) {
          return NextResponse.json({ error: message }, { status: 500 });
        }
      }
    }
  } else {
    const { error: removeError } = await supabase.storage
      .from(MODEL_BUCKET)
      .remove([buildModelPath(id)]);

    // A missing object is fine; a bucket that does not exist yet also should not
    // block removing the reference.
    if (removeError && !/not found|does not exist/i.test(removeError.message)) {
      return NextResponse.json(
        { error: friendlyStorageError(removeError.message) },
        { status: 500 }
      );
    }
  }

  const { error: updateError } = await supabase
    .from('products')
    .update({ model_url: null })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ modelUrl: null });
}
