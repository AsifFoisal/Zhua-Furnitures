import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { parseDivision, DIVISION_ITEM_FULL_COLUMNS, type DivisionItemRow } from '@/lib/division-items';
import { parseCatalogFieldPayload, missingCatalogColumnsMessage, CATALOG_MIGRATION_HINT } from '@/lib/division-item-payload';
import { normalizeCloudinaryImageAsset, type CloudinaryImageAsset } from '@/lib/media';
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

export async function GET() {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('division_items')
    .select(SELECT_COLUMNS)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    if (missingCatalogColumnsMessage(error)) {
      return NextResponse.json({ error: CATALOG_MIGRATION_HINT }, { status: 500 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: (data ?? []).map((row) => mapDivisionItemRow(row as unknown as DivisionItemRow & { updated_at: string })),
  });
}

export async function POST(request: Request) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const payload = (await request.json()) as Record<string, unknown>;

  const division = parseDivision(typeof payload.division === 'string' ? payload.division : null);
  if (!division) {
    return NextResponse.json({ error: 'Division must be wallz or deckz.' }, { status: 400 });
  }

  const title = String(payload.title ?? '').trim();
  if (!title) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  }

  const { fields: catalogFields, error: catalogError } = parseCatalogFieldPayload(payload, {
    requireKind: true,
  });
  if (catalogError) {
    return NextResponse.json({ error: catalogError }, { status: 400 });
  }

  const image = normalizeCloudinaryImageAsset(payload.image);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('division_items')
    .insert({
      division,
      title,
      description: String(payload.description ?? '').trim(),
      category: String(payload.category ?? '').trim(),
      status: toApiStatus(typeof payload.status === 'string' ? payload.status : 'draft'),
      display_order: Number.isFinite(payload.displayOrder)
        ? Math.max(0, Math.round((payload.displayOrder as number) ?? 0))
        : 0,
      image: image ? (image as unknown as Json) : null,
      ...catalogFields,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error || !data) {
    if (error && missingCatalogColumnsMessage(error)) {
      return NextResponse.json({ error: CATALOG_MIGRATION_HINT }, { status: 500 });
    }
    return NextResponse.json({ error: error?.message ?? 'Could not create division item.' }, { status: 500 });
  }

  return NextResponse.json(
    { item: mapDivisionItemRow(data as unknown as DivisionItemRow & { updated_at: string }) },
    { status: 201 },
  );
}
