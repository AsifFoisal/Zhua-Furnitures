import type { Product } from '@/lib/data';

export type FragranceKind = 'machine' | 'oil' | 'bundle' | 'reed';

export const FRAGRANCE_KIND_LABELS: Record<FragranceKind, string> = {
  machine: 'Scent diffuser machine',
  oil: 'Fragrance oil refill',
  bundle: 'Scent bundle',
  reed: 'Reed diffuser',
};

export const FRAGRANCE_SLUGS = {
  machine: 'zhua-scentariva-smart-commercial-scent-diffuser-machine',
  homeBundle: 'zhua-scentariva-home-business-bundle',
  completeCollection: 'zhua-complete-scent-collection',
  reedDiffuser: 'zhua-absolut-gold-150ml-reed-diffuser',
} as const;

export const FRAGRANCE_NOTES: Record<string, string> = {
  'zhua-amber-noir-fragrance-oil-500ml': 'Amber · Oud · Vanilla',
  'zhua-white-tea-fig-fragrance-oil-500ml': 'White tea · Fig · Cedar',
  'zhua-oud-rose-fragrance-oil-500ml': 'Rose · Oud · Patchouli',
  'zhua-coastal-linen-fragrance-oil-500ml': 'Sea salt · Linen · Driftwood',
};

/** Fragrance is merchandised under the existing accessories DB category. */
export function getFragranceKind(
  product: Pick<Product, 'slug' | 'subcategory'> | null | undefined
): FragranceKind | null {
  if (!product) {
    return null;
  }

  if (product.slug === FRAGRANCE_SLUGS.machine) {
    return 'machine';
  }

  if (product.slug === FRAGRANCE_SLUGS.reedDiffuser) {
    return 'reed';
  }

  if (
    product.slug === FRAGRANCE_SLUGS.homeBundle ||
    product.slug === FRAGRANCE_SLUGS.completeCollection
  ) {
    return 'bundle';
  }

  const subcategory = product.subcategory.trim().toLowerCase();

  if (subcategory.includes('scent diffuser') || subcategory.includes('scent machine')) {
    return 'machine';
  }

  if (subcategory.includes('fragrance oil') || subcategory.includes('oil refill')) {
    return 'oil';
  }

  if (subcategory.includes('scent bundle')) {
    return 'bundle';
  }

  if (subcategory.includes('reed diffuser')) {
    return 'reed';
  }

  return null;
}

export function isFragranceProduct(
  product: Pick<Product, 'slug' | 'subcategory'> | null | undefined
): boolean {
  return getFragranceKind(product) !== null;
}

/** Display order for the collection: the machine leads, then oils, bundles, reed. */
export function fragranceSortOrder(product: Product): number {
  const kind = getFragranceKind(product);
  if (kind === 'machine') return 0;
  if (kind === 'oil') return 1;
  if (kind === 'bundle') return 2;
  if (kind === 'reed') return 3;
  return 4;
}

export function sortFragranceProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const order = fragranceSortOrder(a) - fragranceSortOrder(b);
    if (order !== 0) {
      return order;
    }

    return a.name.localeCompare(b.name);
  });
}

export const SCENT_USE_CASES = [
  {
    title: 'Homes & living rooms',
    description: 'A constant, subtle backdrop that makes everyday rooms feel considered.',
    icon: 'home',
  },
  {
    title: 'Hotels & guest houses',
    description: 'A signature arrival scent guests remember long after check-out.',
    icon: 'hotel',
  },
  {
    title: 'Offices & receptions',
    description: 'A fresh, professional first impression from the moment the lift opens.',
    icon: 'briefcase',
  },
  {
    title: 'Beauty salons & spas',
    description: 'Calm, spa-quality atmosphere that helps clients slow down and settle in.',
    icon: 'sparkles',
  },
  {
    title: 'Retail & showrooms',
    description: 'Scent becomes part of the brand experience — memorable and quietly persuasive.',
    icon: 'store',
  },
  {
    title: 'Restaurants & lounges',
    description: 'Warm, inviting layers that complement the room without competing with food.',
    icon: 'utensils',
  },
] as const;

export const SCENT_PROCESS = [
  {
    step: '01',
    title: 'Place',
    description: 'Position ScentaRiva on a stable surface where the fragrance can move through the room.',
  },
  {
    step: '02',
    title: 'Fill',
    description: 'Add the manufacturer-recommended compatible ZHUA ScentaRiva fragrance oil.',
  },
  {
    step: '03',
    title: 'Set',
    description: 'Choose your preferred operating programme on the digital control panel.',
  },
  {
    step: '04',
    title: 'Enjoy',
    description: 'Switch on and let ScentaRiva create a consistent, welcoming atmosphere automatically.',
  },
] as const;
