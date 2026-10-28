import type { Metadata } from 'next';
import type { Product } from '@/lib/data';
import { fallbackStorefrontProducts, getStorefrontProducts } from '@/lib/storefront-products';
import FurnitureLanding from './FurnitureLanding';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Furniture — Custom Sofas, Beds, Dining & Cabinetry',
  description:
    'Custom ZHUA furniture made around your space: sofas and lounges, modular sofas, beds and headboards, dining, TV units, cabinetry, outdoor furniture and reupholstery.',
};

async function getFurnitureProducts(): Promise<Product[]> {
  try {
    const products = await getStorefrontProducts();
    return products.filter((product) => product.category === 'furniture');
  } catch {
    return fallbackStorefrontProducts().filter((product) => product.category === 'furniture');
  }
}

export default async function FurniturePage() {
  const products = await getFurnitureProducts();

  return <FurnitureLanding initialProducts={products} />;
}
