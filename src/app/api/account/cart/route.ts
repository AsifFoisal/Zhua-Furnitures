import { NextResponse } from 'next/server';
import { getOptionalUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasPublicSupabaseEnv, hasServiceSupabaseEnv } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

type CartColor = {
  name: string;
  hex: string;
};

type CartItemProduct = {
  id: string;
  slug: string;
  name: string;
  category: 'furniture' | 'curtains' | 'accessories';
  subcategory: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  badge?: 'new' | 'sale' | 'custom' | 'bestseller';
  description: string;
  longDescription: string;
  images: string[];
  colors: CartColor[];
  sizes?: string[];
  fabrics?: string[];
  inStock: boolean;
  isCustomizable: boolean;
  deliveryDays: string;
  weightKg?: number;
  dimensions?: {
    widthCm?: number;
    depthCm?: number;
    heightCm?: number;
  };
  features: string[];
};

type CartItem = {
  product: CartItemProduct;
  quantity: number;
  selectedColor: string;
  selectedSize?: string;
  selectedFabric?: string;
  customNote?: string;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return value;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);
}

function toColorList(value: unknown): CartColor[] {
  if (!Array.isArray(value)) {
    return [{ name: 'Default', hex: '#B59241' }];
  }

  const colors = value
    .map((entry) => {
      if (!isObjectLike(entry)) {
        return null;
      }

      const name = toStringValue(entry.name);
      const hex = toStringValue(entry.hex);
      if (!name || !hex) {
        return null;
      }

      return { name, hex };
    })
    .filter((entry): entry is CartColor => Boolean(entry));

  return colors.length > 0 ? colors : [{ name: 'Default', hex: '#B59241' }];
}

function toSafeBadge(value: unknown): CartItemProduct['badge'] {
  if (value === 'new' || value === 'sale' || value === 'custom' || value === 'bestseller') {
    return value;
  }

  return undefined;
}

function normalizeProduct(value: unknown): CartItemProduct | null {
  if (!isObjectLike(value)) {
    return null;
  }

  const id = toStringValue(value.id);
  const slug = toStringValue(value.slug);
  const name = toStringValue(value.name);
  const price = Math.max(0, Math.round(toNumberValue(value.price, -1)));

  if (!id || !slug || !name || price < 0) {
    return null;
  }

  const categoryRaw = toStringValue(value.category);
  const category: CartItemProduct['category'] =
    categoryRaw === 'curtains' || categoryRaw === 'accessories' ? categoryRaw : 'furniture';

  const dimensions = isObjectLike(value.dimensions) ? value.dimensions : {};

  return {
    id,
    slug,
    name,
    category,
    subcategory: toStringValue(value.subcategory, 'General'),
    price,
    originalPrice: Number.isFinite(value.originalPrice)
      ? Math.max(0, Math.round(Number(value.originalPrice)))
      : undefined,
    rating: Math.max(0, toNumberValue(value.rating, 5)),
    reviewCount: Math.max(0, Math.round(toNumberValue(value.reviewCount, 0))),
    badge: toSafeBadge(value.badge),
    description: toStringValue(value.description),
    longDescription: toStringValue(value.longDescription),
    images: toStringArray(value.images),
    colors: toColorList(value.colors),
    sizes: toStringArray(value.sizes),
    fabrics: toStringArray(value.fabrics),
    inStock: Boolean(value.inStock),
    isCustomizable: Boolean(value.isCustomizable),
    deliveryDays: toStringValue(value.deliveryDays, '7-14 business days'),
    weightKg: Math.max(0, toNumberValue(value.weightKg, 0)),
    dimensions: {
      widthCm: Math.max(0, toNumberValue(dimensions.widthCm, 0)),
      depthCm: Math.max(0, toNumberValue(dimensions.depthCm, 0)),
      heightCm: Math.max(0, toNumberValue(dimensions.heightCm, 0)),
    },
    features: toStringArray(value.features),
  };
}

function normalizeCartItem(value: unknown): CartItem | null {
  if (!isObjectLike(value)) {
    return null;
  }

  const product = normalizeProduct(value.product);
  if (!product) {
    return null;
  }

  const selectedColor = toStringValue(value.selectedColor);
  if (!selectedColor) {
    return null;
  }

  const quantity = Math.max(1, Math.round(toNumberValue(value.quantity, 1)));
  const selectedSize = toStringValue(value.selectedSize);
  const selectedFabric = toStringValue(value.selectedFabric);
  const customNote = toStringValue(value.customNote);

  return {
    product,
    quantity,
    selectedColor,
    selectedSize: selectedSize || undefined,
    selectedFabric: selectedFabric || undefined,
    customNote: customNote || undefined,
  };
}

function normalizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeCartItem(entry))
    .filter((entry): entry is CartItem => Boolean(entry));
}

async function validateCartItemsAgainstStock(items: CartItem[]) {
  if (items.length === 0 || !hasServiceSupabaseEnv) {
    return {
      items,
      removedOutOfStockCount: 0,
      removedMissingProductCount: 0,
    };
  }

  const productIds = Array.from(
    new Set(
      items
        .map((item) => item.product.id)
        .filter((value) => typeof value === 'string' && value.length > 0)
    )
  );

  const dbProductIds = productIds.filter((id) => isUuid(id));

  if (dbProductIds.length === 0) {
    return {
      items: [],
      removedOutOfStockCount: 0,
      removedMissingProductCount: items.length,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, in_stock, status')
    .in('id', dbProductIds);

  if (error) {
    throw new Error(error.message);
  }

  const availability = new Map(
    (data ?? []).map((row) => [
      row.id,
      row.in_stock === true && row.status === 'active',
    ])
  );

  let removedOutOfStockCount = 0;
  let removedMissingProductCount = 0;

  const validItems = items
    .map((item) => {
      const isAvailable = availability.get(item.product.id);
      if (isAvailable === undefined) {
        removedMissingProductCount += 1;
        return null;
      }

      if (!isAvailable) {
        removedOutOfStockCount += 1;
        return null;
      }

      return {
        ...item,
        product: {
          ...item.product,
          inStock: true,
        },
      };
    })
    .filter((item): item is CartItem => item !== null);

  return {
    items: validItems,
    removedOutOfStockCount,
    removedMissingProductCount,
  };
}

async function fetchUserCartItems(userId: string): Promise<CartItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('user_carts')
    .select('items')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeCartItems(data?.items);
}

export async function GET() {
  if (!hasPublicSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase environment variables are missing.' }, { status: 503 });
  }

  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const items = await fetchUserCartItems(user.id);
    const validated = await validateCartItemsAgainstStock(items);

    return NextResponse.json({
      items: validated.items,
      warnings:
        validated.removedOutOfStockCount > 0 || validated.removedMissingProductCount > 0
          ? {
              removedOutOfStockCount: validated.removedOutOfStockCount,
              removedMissingProductCount: validated.removedMissingProductCount,
            }
          : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load cart.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!hasPublicSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase environment variables are missing.' }, { status: 503 });
  }

  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const payload = (await request.json()) as { items?: unknown };
  const items = normalizeCartItems(payload.items);

  let validated;
  try {
    validated = await validateCartItemsAgainstStock(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not validate cart stock.';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('user_carts')
    .upsert(
      {
        user_id: user.id,
        items: validated.items,
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: validated.items,
    warnings:
      validated.removedOutOfStockCount > 0 || validated.removedMissingProductCount > 0
        ? {
            removedOutOfStockCount: validated.removedOutOfStockCount,
            removedMissingProductCount: validated.removedMissingProductCount,
          }
        : undefined,
  });
}
