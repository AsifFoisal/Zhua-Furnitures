import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { normalizeCloudinaryImageAsset } from '@/lib/media';
import { destroyCloudinaryImage } from '@/lib/cloudinary';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/types/supabase';

export const dynamic = 'force-dynamic';

function toApiStatus(value: string): 'published' | 'draft' {
  return value.trim().toLowerCase() === 'published' ? 'published' : 'draft';
}

function toDisplayStatus(value: 'published' | 'draft'): 'Published' | 'Draft' {
  return value === 'published' ? 'Published' : 'Draft';
}

function mapDivisionItemRow(row: {
  id: string;
  division: string;
  title: string;
  description: string;
  category: string;
  image: unknown;
  status: 'published' | 'draft';
  display_order: number;
  updated_at: string;
}) {
  return {
    id: row.id,
    division: row.division,
    title: row.title,
    description: row.description,
    category: row.category,
    image: normalizeCloudinaryImageAsset(row.image),
    status: toDisplayStatus(row.status),
    displayOrder: row.display_order,
    updatedAt: row.updated_at.replace('T', ' ').slice(0, 16),
  };
}

const SELECT_COLUMNS =
  'id, division, title, description, category, image, status, display_order, updated_at';

async function maybeDeleteReplacedImage(oldValue: unknown, nextValue: unknown) {
  const current = normalizeCloudinaryImageAsset(oldValue);
  const next = normalizeCloudinaryImageAsset(nextValue);

  if (!current) {
    return;
  }

  if (!next || next.publicId !== current.publicId) {
    await destroyCloudinaryImage(current.publicId);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const { id } = await params;
  const payload = (await request.json()) as {
    division?: string;
    title?: string;
    description?: string;
    category?: string;
    status?: string;
    displayOrder?: number;
    image?: unknown;
  };

  const supabase = createSupabaseAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from('division_items')
    .select('image')
    .eq('id', id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: 'Division item not found.' }, { status: 404 });
  }

  try {
    if (payload.image !== undefined) {
      await maybeDeleteReplacedImage(existing.image, payload.image);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not delete replaced Cloudinary image.';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const updateData: {
    division?: 'wallz' | 'deckz';
    title?: string;
    description?: string;
    category?: string;
    status?: 'published' | 'draft';
    display_order?: number;
    image?: Json | null;
  } = {};

  if (payload.division === 'wallz' || payload.division === 'deckz') {
    updateData.division = payload.division;
  }

  if (typeof payload.title === 'string' && payload.title.trim()) {
    updateData.title = payload.title.trim();
  }

  if (typeof payload.description === 'string') {
    updateData.description = payload.description.trim();
  }

  if (typeof payload.category === 'string') {
    updateData.category = payload.category.trim();
  }

  if (typeof payload.status === 'string') {
    updateData.status = toApiStatus(payload.status);
  }

  if (typeof payload.displayOrder === 'number' && Number.isFinite(payload.displayOrder)) {
    updateData.display_order = Math.max(0, Math.round(payload.displayOrder));
  }

  if (payload.image !== undefined) {
    const image = normalizeCloudinaryImageAsset(payload.image);
    updateData.image = image ? (image as unknown as Json) : null;
  }

  const { data, error } = await supabase
    .from('division_items')
    .update(updateData)
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not update division item.' }, { status: 500 });
  }

  return NextResponse.json({ item: mapDivisionItemRow(data) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from('division_items')
    .select('image')
    .eq('id', id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: 'Division item not found.' }, { status: 404 });
  }

  const image = normalizeCloudinaryImageAsset(existing.image);

  if (image) {
    try {
      await destroyCloudinaryImage(image.publicId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete the Cloudinary asset.';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const { error } = await supabase.from('division_items').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
