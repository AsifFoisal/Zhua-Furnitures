import type { Metadata } from 'next';
import type { Product } from '@/lib/data';
import { getStorefrontProducts } from '@/lib/storefront-products';
import { isFragranceProduct, sortFragranceProducts } from '@/lib/fragrance';
import FragranceLanding from './FragranceLanding';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ZHUA ScentaRiva — Home & Business Fragrance Collection',
  description:
    'Discover the ZHUA ScentaRiva Smart Commercial Scent Diffuser Machine, signature 500ml fragrance oils, ready-made scent bundles and Absolut Gold 150ml reed diffusers for homes, hotels, offices, salons and retail spaces.',
  openGraph: {
    title: 'ZHUA ScentaRiva — Home & Business Fragrance Collection',
    description:
      'Smart automatic scenting, signature fragrance oils and Absolut Gold reed diffusers. Turn every space into a beautiful fragrance experience.',
    images: ['/images/categories/fragrance-scent.jpg'],
  },
};

async function getFragranceProducts(): Promise<Product[]> {
  try {
    const products = await getStorefrontProducts();
    return sortFragranceProducts(products.filter((product) => isFragranceProduct(product)));
  } catch {
    return [];
  }
}

export default async function FragrancePage() {
  const products = await getFragranceProducts();

  return <FragranceLanding initialProducts={products} />;
}
