import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasServiceSupabaseEnv } from '@/lib/supabase/env';
import { normalizeCloudinaryImageAsset, type CloudinaryImageAsset } from '@/lib/media';

export const DIVISIONS = ['wallz', 'deckz'] as const;
export type Division = (typeof DIVISIONS)[number];

export interface DivisionItem {
  id: string;
  division: Division;
  title: string;
  description: string;
  category: string;
  image: CloudinaryImageAsset | null;
  displayOrder: number;
}

function isDivision(value: string): value is Division {
  return (DIVISIONS as readonly string[]).includes(value);
}

export function parseDivision(value: string | null | undefined): Division | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return isDivision(normalized) ? normalized : null;
}

function isTableMissingError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    /relation .* does not exist|could not find the table|schema cache/i.test(error.message ?? '')
  );
}

/**
 * Demo content shown on the landing pages until the division_items migration
 * has been applied (and whenever the table exists but has no published rows).
 * Once the table is live, admin edits in /admin/divisions take over.
 */
export const demoDivisionItems: Record<Division, Omit<DivisionItem, 'id' | 'division' | 'displayOrder'>[]> = {
  wallz: [
    { title: 'Sandton Lounge Slat Wall', description: 'Warm timber-look slat panelling behind a custom ZHUA media unit.', category: 'Slat walls', image: null },
    { title: 'Bryanston TV Feature Wall', description: 'Full-height feature wall with an integrated TV niche and concealed lighting.', category: 'TV feature walls', image: null },
    { title: 'Fourways Headboard Wall', description: 'Panelled headboard wall framing a custom ZHUA bed.', category: 'Headboard walls', image: null },
    { title: 'Umhlanga Dining Accent Wall', description: 'Fluted decorative panels that anchor the dining area.', category: 'Accent walls', image: null },
    { title: 'Rosebank Office Reception Wall', description: 'Commercial wall installation for a reception welcome area.', category: 'Commercial installations', image: null },
    { title: 'Midrand Restaurant Cladding', description: 'Durable wood-look cladding for a hospitality space.', category: 'Wood-look cladding', image: null },
  ],
  deckz: [
    { title: 'Sandton Entertainment Deck', description: 'Multi-level deck with built-in seating for weekend entertaining.', category: 'Entertainment areas', image: null },
    { title: 'Centurion Pool Deck', description: 'Barefoot-friendly decking wrapped around the pool.', category: 'Pool decks', image: null },
    { title: 'Pretoria East Patio Deck', description: 'Covered patio converted into a true outdoor living room.', category: 'Patio decking', image: null },
    { title: 'Ballito Balcony Deck', description: 'Elevated balcony with warm underfoot decking and sea views.', category: 'Balcony decking', image: null },
    { title: 'Johannesburg Roof Terrace', description: 'Built-in benches and planters for a city terrace.', category: 'Outdoor seating areas', image: null },
    { title: 'Hartbeespoort Lakeside Deck', description: 'Residential deck stepping down toward the water.', category: 'Residential decking', image: null },
  ],
};

interface DivisionRow {
  id: string;
  division: string;
  title: string;
  description: string;
  category: string;
  image: unknown;
  display_order: number;
}

function mapDivisionRow(row: DivisionRow): DivisionItem {
  return {
    id: row.id,
    division: isDivision(row.division) ? row.division : 'wallz',
    title: row.title,
    description: row.description,
    category: row.category,
    image: normalizeCloudinaryImageAsset(row.image),
    displayOrder: row.display_order,
  };
}

export interface DivisionItemsResult {
  items: DivisionItem[];
  /** 'database' = live rows from Supabase; 'fallback' = built-in demo content. */
  source: 'database' | 'fallback';
}

/**
 * Published division items for a landing page. Reads Supabase with the
 * service-role client and falls back to demo content when the table is
 * missing/empty (migration not applied yet) or on any read error.
 */
export async function getDivisionItems(division: Division): Promise<DivisionItemsResult> {
  if (!hasServiceSupabaseEnv) {
    return { items: demoItems(division), source: 'fallback' };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('division_items')
      .select('id, division, title, description, category, image, display_order')
      .eq('division', division)
      .eq('status', 'published')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      if (!isTableMissingError(error)) {
        console.error(`Could not load division items for ${division}:`, error.message);
      }
      return { items: demoItems(division), source: 'fallback' };
    }

    const items = (data ?? []).map((row) => mapDivisionRow(row as DivisionRow));
    if (items.length === 0) {
      return { items: demoItems(division), source: 'fallback' };
    }

    return { items, source: 'database' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Could not load division items for ${division}:`, message);
    return { items: demoItems(division), source: 'fallback' };
  }
}

function demoItems(division: Division): DivisionItem[] {
  return demoDivisionItems[division].map((item, index) => ({
    ...item,
    id: `demo-${division}-${index + 1}`,
    division,
    displayOrder: index + 1,
  }));
}
