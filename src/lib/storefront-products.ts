import { products as fallbackProducts, type Product, type ProductColor } from '@/lib/data';
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
    return value.filter((entry) => isRenderableImageUrl(entry));
  }

  return [];
}

function isRenderableFallbackImage(value: string): boolean {
  return value.startsWith('/images/') || isRenderableImageUrl(value);
}

export function fallbackStorefrontProducts(): Product[] {
  return fallbackProducts.map((product) => ({
    ...product,
    images: product.images.filter((url) => isRenderableFallbackImage(url)),
    weightKg: Number(product.weightKg ?? 0),
    dimensions: {
      widthCm: Number(product.dimensions?.widthCm ?? 0),
      depthCm: Number(product.dimensions?.depthCm ?? 0),
      heightCm: Number(product.dimensions?.heightCm ?? 0),
    },
  }));
}

/**
 * Reads the active storefront catalogue from Supabase, falling back to the
 * built-in demo catalogue when the service role environment is not configured.
 */
export async function getStorefrontProducts(): Promise<Product[]> {
  if (!hasServiceSupabaseEnv) {
    return fallbackStorefrontProducts();
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, slug, name, category, subcategory, price_cents, original_price_cents, rating, review_count, badge, description, long_description, images, colors, sizes, fabrics, in_stock, is_customizable, delivery_days, weight_kg, width_cm, depth_cm, height_cm, features'
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
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
    inStock: row.in_stock,
    isCustomizable: row.is_customizable,
    deliveryDays: row.delivery_days,
    weightKg: Number(row.weight_kg ?? 0),
    dimensions: {
      widthCm: Number(row.width_cm ?? 0),
      depthCm: Number(row.depth_cm ?? 0),
      heightCm: Number(row.height_cm ?? 0),
    },
    features: row.features ?? [],
  }));
}
