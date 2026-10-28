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
import { destroyCloudinaryImage } from '@/lib/cloudinary';
import { normalizeCloudinaryImageAssets } from '@/lib/media';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

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
    name?: string;
    slug?: string;
    sku?: string;
    category?: string;
    subcategory?: string;
    stock?: number;
    price?: number;
    offerPercentage?: number;
    status?: string;
    badge?: string | null;
    description?: string;
    longDescription?: string;
    deliveryDays?: string;
    weightKg?: number;
    widthCm?: number;
    depthCm?: number;
    heightCm?: number;
    images?: unknown;
    colors?: unknown;
    sizes?: unknown;
    fabrics?: unknown;
  };

  const supabase = createSupabaseAdminClient();

  const updateData: {
    name?: string;
    category?: 'furniture' | 'curtains' | 'accessories';
    subcategory?: string;
    slug?: string;
    sku?: string;
    stock?: number;
    in_stock?: boolean;
    price_cents?: number;
    original_price_cents?: number | null;
    status?: 'active' | 'draft' | 'archived';
    badge?: 'new' | 'sale' | 'custom' | 'bestseller' | null;
    description?: string;
    long_description?: string;
    delivery_days?: string;
    weight_kg?: number;
    width_cm?: number;
    depth_cm?: number;
    height_cm?: number;
    colors?: ProductColor[];
    sizes?: string[];
    fabrics?: string[];
    images?: unknown;
  } = {};

  if (typeof payload.name === 'string' && payload.name.trim()) {
    updateData.name = payload.name.trim();
  }

  if (typeof payload.slug === 'string' && payload.slug.trim()) {
    updateData.slug = slugify(payload.slug);
  }

  if (typeof payload.sku === 'string' && payload.sku.trim()) {
    updateData.sku = payload.sku.trim();
  }

  if (typeof payload.category === 'string') {
    updateData.category = parseCategory(payload.category);
  }

  if (typeof payload.subcategory === 'string' && payload.subcategory.trim()) {
    updateData.subcategory = payload.subcategory.trim();
  }

  if (typeof payload.stock === 'number' && Number.isFinite(payload.stock)) {
    updateData.stock = Math.max(0, Math.round(payload.stock));
    updateData.in_stock = updateData.stock > 0;
  }

  if (typeof payload.status === 'string') {
    updateData.status = parseProductStatus(payload.status);
  }

  if (payload.badge !== undefined) {
    if (payload.badge === null || payload.badge === '') {
      updateData.badge = null;
    } else {
      updateData.badge = parseProductBadge(payload.badge);
    }
  }

  if (typeof payload.description === 'string' && payload.description.trim()) {
    updateData.description = payload.description.trim();
  }

  if (typeof payload.longDescription === 'string') {
    updateData.long_description = payload.longDescription.trim();
  }

  if (typeof payload.deliveryDays === 'string' && payload.deliveryDays.trim()) {
    updateData.delivery_days = payload.deliveryDays.trim();
  }

  if (payload.weightKg !== undefined) {
    updateData.weight_kg = toSafeMeasure(payload.weightKg);
  }

  if (payload.widthCm !== undefined) {
    updateData.width_cm = toSafeMeasure(payload.widthCm);
  }

  if (payload.depthCm !== undefined) {
    updateData.depth_cm = toSafeMeasure(payload.depthCm);
  }

  if (payload.heightCm !== undefined) {
    updateData.height_cm = toSafeMeasure(payload.heightCm);
  }

  if (payload.colors !== undefined) {
    updateData.colors = normalizeProductColors(payload.colors);
  }

  if (payload.sizes !== undefined) {
    updateData.sizes = toSafeStringArray(payload.sizes);
  }

  if (payload.fabrics !== undefined) {
    updateData.fabrics = toSafeStringArray(payload.fabrics);
  }

  if (
    (typeof payload.price === 'number' && Number.isFinite(payload.price)) ||
    payload.offerPercentage !== undefined
  ) {
    const { data: current, error: currentError } = await supabase
      .from('products')
      .select('price_cents, original_price_cents, badge')
      .eq('id', id)
      .single();

    if (currentError || !current) {
      return NextResponse.json(
        { error: currentError?.message ?? 'Could not load current pricing.' },
        { status: 500 }
      );
    }

    const currentBasePrice = (current.original_price_cents ?? current.price_cents) / 100;
    const currentOfferPercentage = calculateOfferPercentage(
      current.price_cents,
      current.original_price_cents
    );
    const nextBasePrice =
      typeof payload.price === 'number' && Number.isFinite(payload.price)
        ? Math.max(0, payload.price)
        : currentBasePrice;
    const nextOfferPercentage =
      payload.offerPercentage !== undefined
        ? clampOfferPercentage(payload.offerPercentage, currentOfferPercentage)
        : currentOfferPercentage;
    const pricing = applyOfferPricing(nextBasePrice, nextOfferPercentage);

    updateData.price_cents = pricing.priceCents;
    updateData.original_price_cents = pricing.originalPriceCents;

    if (payload.badge === undefined) {
      if (nextOfferPercentage > 0 && current.badge === null) {
        updateData.badge = 'sale';
      }

      if (nextOfferPercentage <= 0 && current.badge === 'sale') {
        updateData.badge = null;
      }
    }
  }

  if (payload.images !== undefined) {
    updateData.images = normalizeCloudinaryImageAssets(payload.images);
  }

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select('id, sku, slug, name, category, subcategory, stock, price_cents, original_price_cents, status, badge, description, long_description, delivery_days, weight_kg, width_cm, depth_cm, height_cm, colors, sizes, fabrics, images')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not update product.' }, { status: 500 });
  }

  return NextResponse.json({
    product: toAdminProductRow(data),
  });
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

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('images')
    .eq('id', id)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  const images = normalizeCloudinaryImageAssets(product?.images);
  if (images.length > 0) {
    const deletions = await Promise.allSettled(
      images.map((asset) => destroyCloudinaryImage(asset.publicId))
    );

    const failed = deletions.filter((entry) => entry.status === 'rejected');
    if (failed.length > 0) {
      return NextResponse.json(
        { error: 'Could not delete one or more Cloudinary assets. Product was not removed.' },
        { status: 500 }
      );
    }
  }

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
