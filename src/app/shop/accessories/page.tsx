'use client';

import CategoryProductGrid from '@/components/shop/CategoryProductGrid';
import { useStorefrontProducts } from '@/lib/use-storefront-products';

export default function AccessoriesShopPage() {
  const { products } = useStorefrontProducts();
  const accessories = products.filter((product) => product.category === 'accessories');

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container">
        <span className="label-accent">Shop</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0 1.25rem' }}>Accessories &amp; <span className="heading-accent">Decor</span></h1>
        <CategoryProductGrid products={accessories} emptyMessage="No accessories yet — check back soon." />
      </div>
    </div>
  );
}
