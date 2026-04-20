'use client';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/data';
import { useStorefrontProducts } from '@/lib/use-storefront-products';
import { useWishlistStore, useCartStore } from '@/store';

export default function WishlistPage() {
  const { ids, toggle } = useWishlistStore();
  const { addItem } = useCartStore();
  const { products, loading } = useStorefrontProducts();
  const wishedProducts = products.filter((product) => ids.includes(product.id));

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container">
        <span className="label-accent">Account</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0 1.25rem' }}>Wishlist</h1>

        {loading ? (
          <div style={{ background: '#163250', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.2rem' }}>
            <p style={{ color: '#A9B7C9' }}>Loading your wishlist...</p>
          </div>
        ) : wishedProducts.length === 0 ? (
          <div style={{ background: '#163250', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.2rem' }}>
            <p style={{ color: '#A9B7C9', marginBottom: '0.8rem' }}>No saved items yet.</p>
            <Link href="/shop" className="btn btn-primary btn-sm">Browse Shop</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {wishedProducts.map((product) => (
              <article key={product.id} style={{ background: '#163250', border: '1px solid rgba(181,146,65,0.18)', borderRadius: 14, padding: '1rem', display: 'grid', gap: '0.7rem' }}>
                <h2 style={{ color: '#EAF0F8', fontSize: '1rem' }}>{product.name}</h2>
                <p style={{ color: '#A9B7C9', fontSize: '0.88rem' }}>{product.subcategory}</p>
                <p style={{ color: '#B59241', fontWeight: 600 }}>{formatPrice(product.price)}</p>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!product.inStock}
                    onClick={() => {
                      if (!product.inStock) {
                        toast.error(`${product.name} is out of stock.`);
                        return;
                      }

                      addItem({ product, quantity: 1, selectedColor: product.colors[0].name });
                      toast.success(`${product.name} added to cart.`);
                    }}
                  >
                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={async () => {
                      await toggle(product.id);
                      toast.success(`${product.name} removed from wishlist.`);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
