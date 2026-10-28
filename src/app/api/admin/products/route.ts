import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import {
  displayCategory,
  displayProductBadge,
  displayProductStatus,
  parseCategory,
  parseProductBadge,
  parseProductStatus,
  slugify,
} from '@/lib/admin-api';
import { normalizeCloudinaryImageAssets } from '@/lib/media';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function buildSku(name: string): string {
  const base = slugify(name).toUpperCase().replace(/-/g, '').slice(0, 8);
  const token = Math.floor(Math.random() * 900 + 100);
  return `ZH-${base}-${token}`;
}

function clampOfferPercentage(value: unknown, fallback = 0): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, Math.round(parsed * 100) / 100));
}

function toPriceCents(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value * 100));
}

function toSafeMeasure(value: unknown): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.round(parsed * 100) / 100);
}

function toSafeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0);
}

type ProductColor = {
  name: string;
  hex: string;
  images?: ReturnType<typeof normalizeCloudinaryImageAssets>;
};

function toSafeColorHex(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) {
    return '#B59241';
  }

  return raw.toUpperCase();
}

function normalizeProductColors(value: unknown): ProductColor[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const item = entry as Record<string, unknown>;
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      if (!name) {
        return null;
      }

      const images = normalizeCloudinaryImageAssets(item.images);

      return {
        name,
        hex: toSafeColorHex(item.hex),
        ...(images.length > 0 ? { images } : {}),
      };
    })
    .filter((entry): entry is ProductColor => entry !== null);
}

function applyOfferPricing(basePrice: number, offerPercentage: number): {
  priceCents: number;
  originalPriceCents: number | null;
} {
  const basePriceCents = toPriceCents(basePrice);
  const safeOffer = clampOfferPercentage(offerPercentage, 0);

  if (safeOffer <= 0 || basePriceCents <= 0) {
    return {
      priceCents: basePriceCents,
      originalPriceCents: null,
    };
  }

  const discountedCents = Math.max(
    0,
    Math.round(basePriceCents * ((100 - safeOffer) / 100))
  );

  return {
    priceCents: discountedCents,
    originalPriceCents: basePriceCents,
  };
}

function calculateOfferPercentage(priceCents: number, originalPriceCents: number | null): number {
  if (
    typeof originalPriceCents !== 'number' ||
    originalPriceCents <= 0 ||
    priceCents >= originalPriceCents
  ) {
    return 0;
  }

  return Math.round(((originalPriceCents - priceCents) / originalPriceCents) * 10000) / 100;
}

function toAdminProductRow(product: {
  id: string;
  sku: string;
  slug: string;
  name: string;
  category: 'furniture' | 'curtains' | 'accessories';
  subcategory: string;
  stock: number;
  price_cents: number;
  original_price_cents: number | null;
  status: 'active' | 'draft' | 'archived';
  badge: 'new' | 'sale' | 'custom' | 'bestseller' | null;
  description: string;
  long_description: string;
  delivery_days: string;
  weight_kg: number;
  width_cm: number;
  depth_cm: number;
  height_cm: number;
  colors: unknown;
  sizes: unknown;
  fabrics: unknown;
  images: unknown;
}) {
  const images = normalizeCloudinaryImageAssets(product.images);
  const offerPercentage = calculateOfferPercentage(product.price_cents, product.original_price_cents);
  const hasOffer = offerPercentage > 0;
  const basePriceCents = hasOffer && typeof product.original_price_cents === 'number'
    ? product.original_price_cents
    : product.price_cents;

  return {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    category: displayCategory(product.category),
    subcategory: product.subcategory,
    stock: product.stock,
    price: Math.round(basePriceCents / 100),
    offerPrice: Math.round(product.price_cents / 100),
    originalPrice: hasOffer ? Math.round(basePriceCents / 100) : null,
    offerPercentage,
    badge: product.badge ? displayProductBadge(product.badge) : null,
    status: displayProductStatus(product.status),
    description: product.description,
    longDescription: product.long_description,
    deliveryDays: product.delivery_days,
    weightKg: Number(product.weight_kg ?? 0),
    widthCm: Number(product.width_cm ?? 0),
    depthCm: Number(product.depth_cm ?? 0),
    heightCm: Number(product.height_cm ?? 0),
    colors: normalizeProductColors(product.colors),
    sizes: toSafeStringArray(product.sizes),
    fabrics: toSafeStringArray(product.fabrics),
    images,
    primaryImage: images[0]?.secureUrl ?? null,
    imageCount: images.length,
  };
}

export async function GET() {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, sku, slug, name, category, subcategory, stock, price_cents, original_price_cents, status, badge, description, long_description, delivery_days, weight_kg, width_cm, depth_cm, height_cm, colors, sizes, fabrics, images')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((product) => toAdminProductRow(product));

  return NextResponse.json({ products: rows });
}

export async function POST(request: Request) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const payload = (await request.json()) as {
    name?: string;
    slug?: string;
    sku?: string;
    category?: string;
    subcategory?: string;
    price?: number;
    offerPercentage?: number;
    stock?: number;
    status?: string;
    badge?: string | null;
    images?: unknown;
    colors?: unknown;
    sizes?: unknown;
    fabrics?: unknown;
    description?: string;
    longDescription?: string;
    deliveryDays?: string;
    weightKg?: number;
    widthCm?: number;
    depthCm?: number;
    heightCm?: number;
  };

  const name = String(payload.name ?? '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });
  }

  const category = parseCategory(String(payload.category ?? 'furniture'));
  const price = Number(payload.price ?? 0);
  const offerPercentage = clampOfferPercentage(payload.offerPercentage, 0);
  const pricing = applyOfferPricing(price, offerPercentage);
  const stock = Number(payload.stock ?? 0);
  const slug = slugify(String(payload.slug ?? '').trim() || name);
  const subcategory = String(payload.subcategory ?? '').trim() || 'General';
  const status = parseProductStatus(String(payload.status ?? 'active'));
  const parsedBadge = parseProductBadge(payload.badge);
  const badge = parsedBadge ?? (offerPercentage > 0 ? 'sale' : null);
  const description = String(payload.description ?? '').trim() || `${name} by Zhua Furniture.`;
  const longDescription =
    String(payload.longDescription ?? '').trim() ||
    description;
  const deliveryDays = String(payload.deliveryDays ?? '').trim() || '7-10 business days';
  const weightKg = toSafeMeasure(payload.weightKg);
  const widthCm = toSafeMeasure(payload.widthCm);
  const depthCm = toSafeMeasure(payload.depthCm);
  const heightCm = toSafeMeasure(payload.heightCm);
  const colors = normalizeProductColors(payload.colors);
  const sizes = toSafeStringArray(payload.sizes);
  const fabrics = toSafeStringArray(payload.fabrics);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('products')
    .insert({
      slug,
      name,
      category,
      subcategory,
      price_cents: pricing.priceCents,
      original_price_cents: pricing.originalPriceCents,
      sku: payload.sku?.trim() || buildSku(name),
      stock: Math.max(0, Math.round(stock)),
      status,
      badge,
      in_stock: stock > 0,
      description,
      long_description: longDescription,
      images: normalizeCloudinaryImageAssets(payload.images),
      colors,
      sizes,
      fabrics,
      features: [],
      delivery_days: deliveryDays,
      weight_kg: weightKg,
      width_cm: widthCm,
      depth_cm: depthCm,
      height_cm: heightCm,
    })
    .select('id, sku, slug, name, category, subcategory, stock, price_cents, original_price_cents, status, badge, description, long_description, delivery_days, weight_kg, width_cm, depth_cm, height_cm, colors, sizes, fabrics, images')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create product.' }, { status: 500 });
  }

  return NextResponse.json(
    {
      product: toAdminProductRow(data),
    },
    { status: 201 }
  );
}
