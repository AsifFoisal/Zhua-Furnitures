import { NextResponse } from 'next/server';
import { getStorefrontProducts } from '@/lib/storefront-products';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({ products: await getStorefrontProducts() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load products.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
