import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasServiceSupabaseEnv } from '@/lib/supabase/env';
import { normalizeCloudinaryImageAsset, type CloudinaryImageAsset } from '@/lib/media';
import { normalizeCatalogCategory, type CatalogEntry, type CatalogKind } from '@/lib/wallz-deckz-catalog';

export const DIVISIONS = ['wallz', 'deckz'] as const;
export type Division = (typeof DIVISIONS)[number];

export interface DivisionItem {
  id: string;
  division: Division;
  kind: CatalogKind;
  title: string;
  description: string;
  category: string;
  image: CloudinaryImageAsset | null;
  /** Additional photos for the catalog detail gallery. */
  gallery: CloudinaryImageAsset[];
  startingPrice: number | null;
  costMaterials: number | null;
  costLabour: number | null;
  dimensions: string | null;
  materials: string[];
  finishes: { name: string; hex: string }[];
  inclusions: string[];
  leadTime: string | null;
  location: string | null;
  completedYear: number | null;
  displayOrder: number;
}

export const DIVISION_ITEM_FULL_COLUMNS =
  'id, division, title, description, category, image, gallery, status, display_order, kind, starting_price, cost_materials, cost_labour, dimensions, materials, finishes, inclusions, lead_time, location, completed_year';

const DIVISION_ITEM_LEGACY_COLUMNS =
  'id, division, title, description, category, image, status, display_order';

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
 * True when the catalog-field migration (20261114_0017) has not been applied
 * yet and the query failed because the new columns are unknown.
 */
function isMissingCatalogColumnsError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST204' ||
    error.code === '42703' ||
    /column .* does not exist|could not find the '(kind|gallery|starting_price)' column/i.test(
      error.message ?? '',
    )
  );
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseFinishArray(value: unknown): { name: string; hex: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => entry as { name?: unknown; hex?: unknown })
    .filter(
      (entry): entry is { name: string; hex: string } =>
        typeof entry?.name === 'string' &&
        entry.name.trim().length > 0 &&
        typeof entry?.hex === 'string' &&
        /^#[0-9a-fA-F]{3,8}$/.test(entry.hex),
    )
    .map((entry) => ({ name: entry.name.trim(), hex: entry.hex }));
}

function parsePrice(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
}

function parseYear(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const year = Math.round(value);
  return year >= 1990 && year <= 2100 ? year : null;
}

function parseKind(value: unknown): CatalogKind {
  return value === 'concept' ? 'concept' : 'completed';
}

function parseGallery(value: unknown): CloudinaryImageAsset[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => normalizeCloudinaryImageAsset(entry))
    .filter((asset): asset is CloudinaryImageAsset => asset !== null);
}

/**
 * Demo content shown on the landing pages until the division_items migration
 * has been applied (and whenever the table exists but has no published rows).
 * Once the table is live, admin edits in /admin/divisions take over.
 *
 * Demo images are local stock placeholders so the pages render with real
 * photography before the first admin upload; DB items use Cloudinary assets.
 */
export const demoDivisionItems: Record<Division, Omit<DivisionItem, 'id' | 'division' | 'displayOrder'>[]> = {
  wallz: [
    {
      title: 'Sandton Lounge Slat Wall',
      description: 'Warm timber-look slat panelling behind a custom ZHUA media unit.',
      category: 'Wooden & Timber Slat Panels',
      kind: 'completed',
      image: { publicId: 'demo/wallz-slat-partition', secureUrl: '/images/zhua/showcase-wallz-slat-partition.jpg', alt: 'Slat wall panelling behind a dining area' },
      gallery: [],
      startingPrice: null,
      costMaterials: null,
      costLabour: null,
      dimensions: null,
      materials: [],
      finishes: [],
      inclusions: [],
      leadTime: null,
      location: null,
      completedYear: null,
    },
    {
      title: 'Bryanston TV Feature Wall',
      description: 'Full-height feature wall with an integrated TV niche and concealed lighting.',
      category: 'TV & Media Walls',
      kind: 'completed',
      image: { publicId: 'demo/wallz-media-wall', secureUrl: '/images/zhua/wallz-media-wall-warm.jpg', alt: 'Warm media wall with a built-in TV niche' },
      gallery: [],
      startingPrice: null,
      costMaterials: null,
      costLabour: null,
      dimensions: null,
      materials: [],
      finishes: [],
      inclusions: [],
      leadTime: null,
      location: null,
      completedYear: null,
    },
    {
      title: 'Fourways Headboard Wall',
      description: 'Panelled headboard wall framing a custom ZHUA bed.',
      category: 'Decorative Wall Cladding',
      kind: 'completed',
      image: { publicId: 'demo/wallz-headboard', secureUrl: '/images/zhua/showcase-wallz-headboard.jpg', alt: 'Bedroom with a panelled headboard wall' },
      gallery: [],
      startingPrice: null,
      costMaterials: null,
      costLabour: null,
      dimensions: null,
      materials: [],
      finishes: [],
      inclusions: [],
      leadTime: null,
      location: null,
      completedYear: null,
    },
    {
      title: 'Umhlanga Dining Accent Wall',
      description: 'Fluted decorative panels that anchor the dining area.',
      category: 'Modern Wall Finishes',
      kind: 'completed',
      image: { publicId: 'demo/wallz-accent', secureUrl: '/images/zhua/showcase-wallz-accent.jpg', alt: 'Accent wall in a styled lounge' },
      gallery: [],
      startingPrice: null,
      costMaterials: null,
      costLabour: null,
      dimensions: null,
      materials: [],
      finishes: [],
      inclusions: [],
      leadTime: null,
      location: null,
      completedYear: null,
    },
    {
      title: 'Rosebank Office Reception Wall',
      description: 'Commercial wall installation for a reception welcome area.',
      category: 'Modern Wall Finishes',
      kind: 'completed',
      image: { publicId: 'demo/wallz-reception', secureUrl: '/images/zhua/showcase-wallz-formal.jpg', alt: 'Wall panelling and built-ins in a formal reception space' },
      gallery: [],
      startingPrice: null,
      costMaterials: null,
      costLabour: null,
      dimensions: null,
      materials: [],
      finishes: [],
      inclusions: [],
      leadTime: null,
      location: null,
      completedYear: null,
    },
    {
      title: 'Midrand Restaurant Cladding',
      description: 'Durable wood-look cladding for a hospitality space.',
      category: 'Decorative Wall Cladding',
      kind: 'completed',
      image: { publicId: 'demo/wallz-cladding', secureUrl: '/images/zhua/showcase-wallz-builtins.jpg', alt: 'Wood-look wall cladding with built-in cabinetry' },
      gallery: [],
      startingPrice: null,
      costMaterials: null,
      costLabour: null,
      dimensions: null,
      materials: [],
      finishes: [],
      inclusions: [],
      leadTime: null,
      location: null,
      completedYear: null,
    },
  ],
  deckz: [
    {
      title: 'Sandton Entertainment Deck',
      description: 'Multi-level deck with built-in seating for weekend entertaining.',
      category: 'Outdoor Entertainment Areas',
      kind: 'completed',
      image: { publicId: 'demo/deckz-terrace', secureUrl: '/images/zhua/showcase-deckz-terrace.jpg', alt: 'Outdoor terrace deck with pool and lounge seating' },
      gallery: [],
      startingPrice: null,
      costMaterials: null,
      costLabour: null,
      dimensions: null,
      materials: [],
      finishes: [],
      inclusions: [],
      leadTime: null,
      location: null,
      completedYear: null,
    },
    {
      title: 'Centurion Pool Deck',
      description: 'Barefoot-friendly decking wrapped around the pool.',
      category: 'Pool Decks',
      kind: 'completed',
      image: { publicId: 'demo/deckz-pool', secureUrl: '/images/zhua/showcase-deckz-pool.jpg', alt: 'Pool deck wrapping around a modern swimming pool' },
      gallery: [],
      startingPrice: null,
      costMaterials: null,
      costLabour: null,
      dimensions: null,
      materials: [],
      finishes: [],
      inclusions: [],
      leadTime: null,
      location: null,
      completedYear: null,
    },
    {
      title: 'Pretoria East Patio Deck',
      description: 'Covered patio converted into a true outdoor living room.',
      category: 'Outdoor Patios',
      kind: 'completed',
      image: { publicId: 'demo/deckz-patio', secureUrl: '/images/zhua/showcase-deckz-patio.jpg', alt: 'Covered patio with decking and outdoor lounge furniture' },
      gallery: [],
      startingPrice: null,
      costMaterials: null,
      costLabour: null,
      dimensions: null,
      materials: [],
      finishes: [],
      inclusions: [],
      leadTime: null,
      location: null,
      completedYear: null,
    },
    {
      title: 'Ballito Balcony Deck',
      description: 'Elevated balcony with warm underfoot decking and sea views.',
      category: 'Wooden & Composite Decks',
      kind: 'completed',
      image: { publicId: 'demo/deckz-balcony', secureUrl: '/images/zhua/showcase-deckz-balcony.jpg', alt: 'Elevated balcony deck with outdoor seating' },
      gallery: [],
      startingPrice: null,
      costMaterials: null,
      costLabour: null,
      dimensions: null,
      materials: [],
      finishes: [],
      inclusions: [],
      leadTime: null,
      location: null,
      completedYear: null,
    },
    {
      title: 'Johannesburg Roof Terrace',
      description: 'Built-in benches and planters for a city terrace.',
      category: 'Wooden & Composite Decks',
      kind: 'completed',
      image: { publicId: 'demo/deckz-roof', secureUrl: '/images/zhua/showcase-deckz-garden.jpg', alt: 'Outdoor platform and garden paving at a modern home' },
      gallery: [],
      startingPrice: null,
      costMaterials: null,
      costLabour: null,
      dimensions: null,
      materials: [],
      finishes: [],
      inclusions: [],
      leadTime: null,
      location: null,
      completedYear: null,
    },
    {
      title: 'Hartbeespoort Lakeside Deck',
      description: 'Residential deck stepping down toward the water.',
      category: 'Wooden & Composite Decks',
      kind: 'completed',
      image: { publicId: 'demo/deckz-residential', secureUrl: '/images/zhua/showcase-deckz-residential.jpg', alt: 'Residential deck and lawn leading to the water' },
      gallery: [],
      startingPrice: null,
      costMaterials: null,
      costLabour: null,
      dimensions: null,
      materials: [],
      finishes: [],
      inclusions: [],
      leadTime: null,
      location: null,
      completedYear: null,
    },
  ],
};

export interface DivisionItemRow {
  id: string;
  division: string;
  title: string;
  description: string;
  category: string;
  image: unknown;
  gallery?: unknown;
  status: string;
  display_order: number;
  kind?: unknown;
  starting_price?: unknown;
  cost_materials?: unknown;
  cost_labour?: unknown;
  dimensions?: unknown;
  materials?: unknown;
  finishes?: unknown;
  inclusions?: unknown;
  lead_time?: unknown;
  location?: unknown;
  completed_year?: unknown;
}

function mapDivisionItemRow(row: DivisionItemRow): DivisionItem {
  return {
    id: row.id,
    division: isDivision(row.division) ? row.division : 'wallz',
    kind: parseKind(row.kind),
    title: row.title,
    description: row.description,
    category: row.category
      ? normalizeCatalogCategory(
          isDivision(row.division) ? row.division : 'wallz',
          row.category,
        )
      : row.division === 'deckz'
        ? 'Wooden & Composite Decks'
        : 'Modern Wall Finishes',
    image: normalizeCloudinaryImageAsset(row.image),
    gallery: parseGallery(row.gallery),
    startingPrice: parsePrice(row.starting_price),
    costMaterials: parsePrice(row.cost_materials),
    costLabour: parsePrice(row.cost_labour),
    dimensions: typeof row.dimensions === 'string' && row.dimensions.trim() ? row.dimensions.trim() : null,
    materials: parseStringArray(row.materials),
    finishes: parseFinishArray(row.finishes),
    inclusions: parseStringArray(row.inclusions),
    leadTime: typeof row.lead_time === 'string' && row.lead_time.trim() ? row.lead_time.trim() : null,
    location: typeof row.location === 'string' && row.location.trim() ? row.location.trim() : null,
    completedYear: parseYear(row.completed_year),
    displayOrder: row.display_order,
  };
}

export interface DivisionItemsResult {
  items: DivisionItem[];
  /** 'database' = live rows from Supabase; 'fallback' = built-in demo content. */
  source: 'database' | 'fallback';
  /**
   * 'full' = catalog fields available (migration 20261114_0017 applied);
   * 'legacy' = only the base columns exist and defaults were filled in.
   */
  schema: 'full' | 'legacy';
}

/**
 * Published division items for a landing page. Reads Supabase with the
 * service-role client and falls back to demo content when the table is
 * missing/empty (migration not applied yet) or on any read error. When the
 * catalog-field migration has not been applied yet, rows are read with the
 * legacy column set and the catalog fields are filled with defaults.
 */
export async function getDivisionItems(division: Division): Promise<DivisionItemsResult> {
  if (!hasServiceSupabaseEnv) {
    return { items: demoItems(division), source: 'fallback', schema: 'legacy' };
  }

  try {
    const supabase = createSupabaseAdminClient();

    let rows: DivisionItemRow[] | null = null;
    let schema: 'full' | 'legacy' = 'full';

    const fullResult = await supabase
      .from('division_items')
      .select(DIVISION_ITEM_FULL_COLUMNS)
      .eq('division', division)
      .eq('status', 'published')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (fullResult.error && isMissingCatalogColumnsError(fullResult.error)) {
      schema = 'legacy';
      const legacyResult = await supabase
        .from('division_items')
        .select(DIVISION_ITEM_LEGACY_COLUMNS)
        .eq('division', division)
        .eq('status', 'published')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (legacyResult.error) {
        if (!isTableMissingError(legacyResult.error)) {
          console.error(`Could not load division items for ${division}:`, legacyResult.error.message);
        }
        return { items: demoItems(division), source: 'fallback', schema: 'legacy' };
      }

      rows = (legacyResult.data ?? []) as DivisionItemRow[];
    } else if (fullResult.error) {
      if (!isTableMissingError(fullResult.error)) {
        console.error(`Could not load division items for ${division}:`, fullResult.error.message);
      }
      return { items: demoItems(division), source: 'fallback', schema: 'legacy' };
    } else {
      rows = (fullResult.data ?? []) as DivisionItemRow[];
    }

    const items = (rows ?? []).map((row) => mapDivisionItemRow(row));
    if (items.length === 0) {
      return { items: demoItems(division), source: 'fallback', schema };
    }

    return { items, source: 'database', schema };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Could not load division items for ${division}:`, message);
    return { items: demoItems(division), source: 'fallback', schema: 'legacy' };
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

/**
 * Convert admin-managed division items into catalog entries so they render in
 * the WALLZ/DECKZ hybrid catalog. Rows missing optional catalog fields (or
 * read before the catalog-field migration) render gracefully — "Price on
 * request", no specs — while fully filled rows render like curated entries.
 */
export function toCatalogEntries(items: DivisionItem[]): CatalogEntry[] {
  return items.map((item) => {
    const heroGallery = item.gallery.length > 0 ? item.gallery : item.image ? [item.image] : [];

    return {
      id: `db-${item.id}`,
      division: item.division,
      kind: item.kind,
      title: item.title,
      category: item.category,
      summary: item.description,
      overview: item.description,
      startingPrice: item.startingPrice,
      dimensions: item.dimensions,
      materials: item.materials,
      finishes: item.finishes,
      inclusions: item.inclusions,
      gallery: heroGallery.map((asset) => ({ src: asset.secureUrl, alt: asset.alt || item.title })),
      costBreakdown:
        item.startingPrice !== null && item.costMaterials !== null && item.costLabour !== null
          ? {
              materials: item.costMaterials,
              labour: item.costLabour,
              total: item.startingPrice,
            }
          : null,
      leadTime: item.leadTime,
      location: item.location,
      completedYear: item.completedYear,
    } satisfies CatalogEntry;
  });
}
