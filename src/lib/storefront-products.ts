import type { Product, ProductColor } from '@/lib/data';
import { normalizeCloudinaryImageAssets } from '@/lib/media';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasServiceSupabaseEnv } from '@/lib/supabase/env';

function isRenderableImageUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https:\/\//i.test(value.trim());
}

function toColorImages(value: unknown): string[] {
  const cloudinary = normalizeCloudinaryImageAssets(value)
    .map((asset) => asset.secureUrl)
    .filter((url) => isRenderableImageUrl(url));

  if (cloudinary.length > 0) {
    return cloudinary;
  }

  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === 'string' && isRenderableImageUrl(entry));
  }

  return [];
}

function toSafeColors(value: unknown): ProductColor[] {
  if (!Array.isArray(value)) {
    return [{ name: 'Default', hex: '#B59241' }];
  }

  const colors = value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const item = entry as Record<string, unknown>;
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      const hex = typeof item.hex === 'string' ? item.hex.trim() : '';

      if (!name || !hex) {
        return null;
      }

      const images = toColorImages(item.images);

      return images.length > 0 ? { name, hex, images } : { name, hex };
    })
    .filter((entry): entry is ProductColor => entry !== null);

  return colors.length > 0 ? colors : [{ name: 'Default', hex: '#B59241' }];
}

function toSafeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0);
}

function toImageUrls(value: unknown): string[] {
  const cloudinary = normalizeCloudinaryImageAssets(value)
    .map((asset) => asset.secureUrl)
    .filter((url) => isRenderableImageUrl(url));

  if (cloudinary.length > 0) {
    return cloudinary;
  }

  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === 'string' && isRenderableImageUrl(entry));
  }

  return [];
}

/** Row shape of the dynamic-column select below. */
interface StorefrontProductRow {
  id: string;
  slug: string;
  name: string;
  category: Product['category'];
  subcategory: string;
  price_cents: number;
  original_price_cents: number | null;
  rating: number | null;
  review_count: number;
  badge: Product['badge'] | null;
  description: string;
  long_description: string;
  images: unknown;
  colors: unknown;
  sizes: unknown;
  fabrics: unknown;
  light_filtration?: unknown;
  top_styles?: unknown;
  in_stock: boolean;
  is_customizable: boolean;
  delivery_days: string;
  weight_kg: number | null;
  width_cm: number | null;
  depth_cm: number | null;
  height_cm: number | null;
  features: string[] | null;
  model_url: string | null;
}

const STOREFRONT_PRODUCT_COLUMNS =
  'id, slug, name, category, subcategory, price_cents, original_price_cents, rating, review_count, badge, description, long_description, images, colors, sizes, fabrics, light_filtration, top_styles, in_stock, is_customizable, delivery_days, weight_kg, width_cm, depth_cm, height_cm, features, model_url';

/** Pre-migration column set (curtain fields not added yet). */
const STOREFRONT_PRODUCT_LEGACY_COLUMNS =
  'id, slug, name, category, subcategory, price_cents, original_price_cents, rating, review_count, badge, description, long_description, images, colors, sizes, fabrics, in_stock, is_customizable, delivery_days, weight_kg, width_cm, depth_cm, height_cm, features, model_url';

function isMissingCurtainColumnsError(error: { code?: string; message?: string } | null): boolean {
  if (!error) {
    return false;
  }

  return (
    error.code === 'PGRST204' ||
    error.code === '42703' ||
    /column .* does not exist|could not find the '(light_filtration|top_styles)' column/i.test(
      error.message ?? '',
    )
  );
}

/**
 * Reads the active storefront catalogue from Supabase. Returns an empty
 * catalogue when the service role environment is not configured — callers
 * render a skeleton while loading and an empty state afterwards. No mock
 * fallback products.
 */
export async function getStorefrontProducts(): Promise<Product[]> {
  if (!hasServiceSupabaseEnv) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  const runQuery = (columns: string) =>
    supabase
      .from('products')
      .select(columns)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

  let { data, error } = await runQuery(STOREFRONT_PRODUCT_COLUMNS);

  // The curtain columns ship in migration 20261123_0018. Until it is applied,
  // fall back to the old column set so the storefront keeps working.
  if (error && isMissingCurtainColumnsError(error)) {
    ({ data, error } = await runQuery(STOREFRONT_PRODUCT_LEGACY_COLUMNS));
  }

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as StorefrontProductRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory,
    price: Math.round(row.price_cents / 100),
    originalPrice:
      typeof row.original_price_cents === 'number'
        ? Math.round(row.original_price_cents / 100)
        : undefined,
    rating: Number(row.rating ?? 5),
    reviewCount: row.review_count,
    badge: row.badge ?? undefined,
    description: row.description,
    longDescription: row.long_description,
    images: toImageUrls(row.images),
    colors: toSafeColors(row.colors),
    sizes: toSafeStringArray(row.sizes),
    fabrics: toSafeStringArray(row.fabrics),
    lightFiltration: toSafeStringArray(row.light_filtration),
    topStyles: toSafeStringArray(row.top_styles),
    inStock: row.in_stock,
    isCustomizable: row.is_customizable,
    deliveryDays: row.delivery_days,
    modelUrl:
      typeof row.model_url === 'string' && row.model_url.trim().length > 0
        ? row.model_url
        : undefined,
    weightKg: Number(row.weight_kg ?? 0),
    dimensions: {
      widthCm: Number(row.width_cm ?? 0),
      depthCm: Number(row.depth_cm ?? 0),
      heightCm: Number(row.height_cm ?? 0),
    },
    features: row.features ?? [],
  }));
}
