'use client';

import CategoryProductGrid from '@/components/shop/CategoryProductGrid';
import { useStorefrontProducts } from '@/lib/use-storefront-products';

export default function CurtainsShopPage() {
  const { products } = useStorefrontProducts();
  const curtains = products.filter((product) => product.category === 'curtains');

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container">
        <span className="label-accent">Shop</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0 1.25rem' }}>Curtains &amp; <span className="heading-accent">Blinds</span></h1>
        <CategoryProductGrid products={curtains} emptyMessage="No curtains or blinds products yet — check back soon." />
      </div>
    </div>
  );
}
