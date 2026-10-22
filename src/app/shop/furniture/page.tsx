'use client';

import CategoryProductGrid from '@/components/shop/CategoryProductGrid';
import { useStorefrontProducts } from '@/lib/use-storefront-products';

export default function FurnitureShopPage() {
  const { products } = useStorefrontProducts();
  const furniture = products.filter((product) => product.category === 'furniture');

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container">
        <span className="label-accent">Shop</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0 1.25rem' }}>Furniture Collection</h1>
        <CategoryProductGrid products={furniture} emptyMessage="No furniture products yet — check back soon." />
      </div>
    </div>
  );
}
