import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { DIVISION_ITEM_FULL_COLUMNS, type DivisionItemRow } from '@/lib/division-items';
import { parseCatalogFieldPayload, missingCatalogColumnsMessage, CATALOG_MIGRATION_HINT, type ParsedCatalogFields } from '@/lib/division-item-payload';
import { normalizeCloudinaryImageAsset, type CloudinaryImageAsset } from '@/lib/media';
import { destroyCloudinaryImage } from '@/lib/cloudinary';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/types/supabase';

export const dynamic = 'force-dynamic';

function toApiStatus(value: string): 'published' | 'draft' {
  return value.trim().toLowerCase() === 'published' ? 'published' : 'draft';
}

function toDisplayStatus(value: string): 'Published' | 'Draft' {
  return value === 'published' ? 'Published' : 'Draft';
}

function mapDivisionItemRow(row: DivisionItemRow & { updated_at: string }) {
  const gallery = Array.isArray(row.gallery)
    ? (row.gallery
        .map((entry) => normalizeCloudinaryImageAsset(entry))
        .filter((asset): asset is CloudinaryImageAsset => asset !== null))
    : [];

  return {
    id: row.id,
    division: row.division,
    kind: row.kind === 'concept' ? 'concept' : 'completed',
    title: row.title,
    description: row.description,
    category: row.category,
    image: normalizeCloudinaryImageAsset(row.image),
    gallery,
    startingPrice: typeof row.starting_price === 'number' ? row.starting_price : null,
    costMaterials: typeof row.cost_materials === 'number' ? row.cost_materials : null,
    costLabour: typeof row.cost_labour === 'number' ? row.cost_labour : null,
    dimensions: typeof row.dimensions === 'string' ? row.dimensions : '',
    materials: Array.isArray(row.materials)
      ? row.materials.filter((entry): entry is string => typeof entry === 'string')
      : [],
    finishes: Array.isArray(row.finishes)
      ? row.finishes.filter(
          (entry): entry is { name: string; hex: string } =>
            !!entry &&
            typeof entry === 'object' &&
            typeof (entry as { name?: unknown }).name === 'string' &&
            typeof (entry as { hex?: unknown }).hex === 'string',
        )
      : [],
    inclusions: Array.isArray(row.inclusions)
      ? row.inclusions.filter((entry): entry is string => typeof entry === 'string')
      : [],
    leadTime: typeof row.lead_time === 'string' ? row.lead_time : '',
    location: typeof row.location === 'string' ? row.location : '',
    completedYear: typeof row.completed_year === 'number' ? row.completed_year : null,
    status: toDisplayStatus(row.status),
    displayOrder: row.display_order,
    updatedAt: row.updated_at.replace('T', ' ').slice(0, 16),
  };
}

const SELECT_COLUMNS = DIVISION_ITEM_FULL_COLUMNS + ', updated_at';

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

/** Delete Cloudinary assets that were removed from the gallery. */
async function cleanupRemovedGalleryAssets(oldGallery: unknown, nextGallery: unknown) {
  const previous = Array.isArray(oldGallery)
    ? (oldGallery
        .map((entry) => normalizeCloudinaryImageAsset(entry))
        .filter((asset): asset is CloudinaryImageAsset => asset !== null))
    : [];

  const next = Array.isArray(nextGallery)
    ? (nextGallery
        .map((entry) => normalizeCloudinaryImageAsset(entry))
        .filter((asset): asset is CloudinaryImageAsset => asset !== null))
    : [];

  const keptPublicIds = new Set(next.map((asset) => asset.publicId));
  const removed = previous.filter((asset) => !keptPublicIds.has(asset.publicId));

  for (const asset of removed) {
    await destroyCloudinaryImage(asset.publicId);
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
  const payload = (await request.json()) as Record<string, unknown>;

  const supabase = createSupabaseAdminClient();

  // Read the current media references. Before the catalog migration is
  // applied the gallery column doesn't exist yet — degrade to image-only.
  let existing: { image: unknown; gallery: unknown } | null = null;
  {
    const fullMedia = await supabase
      .from('division_items')
      .select('image, gallery')
      .eq('id', id)
      .maybeSingle();

    if (fullMedia.error && missingCatalogColumnsMessage(fullMedia.error)) {
      const legacyMedia = await supabase
        .from('division_items')
        .select('image')
        .eq('id', id)
        .maybeSingle();
      if (legacyMedia.error) {
        return NextResponse.json({ error: legacyMedia.error.message }, { status: 500 });
      }
      existing = legacyMedia.data ? { image: legacyMedia.data.image, gallery: null } : null;
    } else if (fullMedia.error) {
      return NextResponse.json({ error: fullMedia.error.message }, { status: 500 });
    } else {
      existing = fullMedia.data ? { image: fullMedia.data.image, gallery: fullMedia.data.gallery } : null;
    }
  }

  if (!existing) {
    return NextResponse.json({ error: 'Division item not found.' }, { status: 404 });
  }

  const { fields: catalogFields, error: catalogError } = parseCatalogFieldPayload(payload);
  if (catalogError) {
    return NextResponse.json({ error: catalogError }, { status: 400 });
  }

  try {
    if (payload.image !== undefined) {
      await maybeDeleteReplacedImage(existing.image, payload.image);
    }
    if (payload.gallery !== undefined) {
      await cleanupRemovedGalleryAssets(existing.gallery, payload.gallery);
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
  } & ParsedCatalogFields = { ...catalogFields };

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
    if (error && missingCatalogColumnsMessage(error)) {
      return NextResponse.json({ error: CATALOG_MIGRATION_HINT }, { status: 500 });
    }
    return NextResponse.json({ error: error?.message ?? 'Could not update division item.' }, { status: 500 });
  }

  return NextResponse.json({ item: mapDivisionItemRow(data as unknown as DivisionItemRow & { updated_at: string }) });
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

  let existing: { image: unknown; gallery: unknown } | null = null;
  {
    const fullMedia = await supabase
      .from('division_items')
      .select('image, gallery')
      .eq('id', id)
      .maybeSingle();

    if (fullMedia.error && missingCatalogColumnsMessage(fullMedia.error)) {
      const legacyMedia = await supabase
        .from('division_items')
        .select('image')
        .eq('id', id)
        .maybeSingle();
      if (legacyMedia.error) {
        return NextResponse.json({ error: legacyMedia.error.message }, { status: 500 });
      }
      existing = legacyMedia.data ? { image: legacyMedia.data.image, gallery: null } : null;
    } else if (fullMedia.error) {
      return NextResponse.json({ error: fullMedia.error.message }, { status: 500 });
    } else {
      existing = fullMedia.data ? { image: fullMedia.data.image, gallery: fullMedia.data.gallery } : null;
    }
  }

  if (!existing) {
    return NextResponse.json({ error: 'Division item not found.' }, { status: 404 });
  }

  const assets = [
    normalizeCloudinaryImageAsset(existing.image),
    ...(Array.isArray(existing.gallery)
      ? (existing.gallery
          .map((entry) => normalizeCloudinaryImageAsset(entry))
          .filter((asset): asset is CloudinaryImageAsset => asset !== null))
      : []),
  ].filter((asset): asset is CloudinaryImageAsset => asset !== null);

  for (const asset of assets) {
    try {
      await destroyCloudinaryImage(asset.publicId);
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
