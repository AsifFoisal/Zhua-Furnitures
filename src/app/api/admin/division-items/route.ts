import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { parseDivision } from '@/lib/division-items';
import { normalizeCloudinaryImageAsset } from '@/lib/media';
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: (data ?? []).map((row) => mapDivisionItemRow(row)),
  });
}

export async function POST(request: Request) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const payload = (await request.json()) as {
    division?: string;
    title?: string;
    description?: string;
    category?: string;
    status?: string;
    displayOrder?: number;
    image?: unknown;
  };

  const division = parseDivision(payload.division);
  if (!division) {
    return NextResponse.json({ error: 'Division must be wallz or deckz.' }, { status: 400 });
  }

  const title = String(payload.title ?? '').trim();
  if (!title) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
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
      status: toApiStatus(String(payload.status ?? 'draft')),
      display_order: Number.isFinite(payload.displayOrder)
        ? Math.max(0, Math.round(payload.displayOrder ?? 0))
        : 0,
      image: image ? (image as unknown as Json) : null,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create division item.' }, { status: 500 });
  }

  return NextResponse.json({ item: mapDivisionItemRow(data) }, { status: 201 });
}
