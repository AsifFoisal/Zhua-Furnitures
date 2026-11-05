'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Star, ArrowRight, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, type Product } from '@/lib/data';
import ProductImageLightbox from '@/components/ui/ProductImageLightbox';
import { useCartStore, useWishlistStore } from '@/store';
import { useStorefrontProducts } from '@/lib/use-storefront-products';
import { ProductGridSkeleton } from '@/components/ui/ProductCardSkeleton';
import styles from './FeaturedProducts.module.css';

type ImagePreviewState = {
  productName: string;
  images: string[];
  index: number;
};

function toPreviewImages(images: string[]): string[] {
  return images.filter((image) => typeof image === 'string' && image.trim().length > 0);
}

export default function FeaturedProducts() {
  const { products, loading } = useStorefrontProducts();
  const featured = products.slice(0, 6);
  const [imagePreview, setImagePreview] = useState<ImagePreviewState | null>(null);
  const { addItem } = useCartStore();
  const { toggle, has } = useWishlistStore();

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.inStock) {
      toast.error(`${product.name} is out of stock.`);
      return;
    }

    addItem({
      product,
      quantity: 1,
      selectedColor: product.colors[0].name,
      selectedSize: product.sizes?.[0],
    });
    toast.success(`${product.name} added to cart.`);
  };

  const openImagePreview = (productName: string, images: string[], event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const previewImages = toPreviewImages(images);
    if (previewImages.length === 0) {
      return;
    }

    setImagePreview({
      productName,
      images: previewImages,
      index: 0,
    });
  };

  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <span className="label-accent">Handpicked for You</span>
            <div className="gold-divider" style={{ margin: '0.75rem 0 1rem' }} />
            <h2 className="heading-xl"><span className="heading-accent">Featured</span> Collection</h2>
          </div>
          <Link href="/shop" className="btn btn-outline btn-sm">
            View All <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <ProductGridSkeleton count={6} />
        ) : featured.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No featured products yet — check back soon.</p>
        ) : (
        <div className={styles.grid}>
          {featured.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} className={styles.card}>
              {/* Image */}
              <div className={styles.imageWrap}>
                <div className={styles.imagePlaceholder}>
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className={styles.productImage}
                    />
                  ) : (
                    <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 0 }} aria-hidden="true" />
                  )}
                </div>

                {/* Badges */}
                {product.badge && (
                  <div className={styles.badges}>
                    <span className={`badge badge-${product.badge}`}>
                      {product.badge === 'bestseller' ? '🏆 Bestseller' : product.badge.charAt(0).toUpperCase() + product.badge.slice(1)}
                    </span>
                  </div>
                )}

                {/* Actions overlay */}
                <div className={styles.actions}>
                  <button
                    className={`${styles.actionBtn} ${has(product.id) ? styles.actionBtnActive : ''}`}
                    onClick={async (e) => {
                      e.preventDefault();
                      const alreadyWishlisted = has(product.id);
                      await toggle(product.id);
                      toast.success(
                        alreadyWishlisted
                          ? `${product.name} removed from wishlist.`
                          : `${product.name} added to wishlist.`
                      );
                    }}
                    aria-label="Add to wishlist"
                  >
                    <Heart size={16} fill={has(product.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Quick add */}
                <button
                  className={`${styles.quickAdd} ${!product.inStock ? styles.quickAddOutOfStock : ''}`}
                  onClick={(e) => handleAddToCart(product, e)}
                  aria-label={product.inStock ? 'Add to cart' : 'Out of stock'}
                  disabled={!product.inStock}
                >
                  <ShoppingBag size={14} /> {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>

                {product.images[0] ? (
                  <button
                    type="button"
                    className={styles.zoomTrigger}
                    aria-label={`Preview ${product.name} image`}
                    onClick={(event) => openImagePreview(product.name, product.images, event)}
                  >
                    <ZoomIn size={16} />
                  </button>
                ) : null}
              </div>

              {/* Info */}
              <div className={styles.info}>
                <p className={styles.category}>{product.subcategory}</p>
                <h3 className={styles.name}>{product.name}</h3>
                <div className={styles.ratingRow}>
                  <div className={styles.stars}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={11} fill={i < Math.floor(product.rating) ? '#B59241' : 'none'} color="#B59241" />
                    ))}
                  </div>
                  <span className={styles.ratingText}>({product.reviewCount})</span>
                </div>
                <div className={styles.priceRow}>
                  <span className={styles.price}>{formatPrice(product.price)}</span>
                  {product.originalPrice && (
                    <span className={styles.originalPrice}>{formatPrice(product.originalPrice)}</span>
                  )}
                </div>
                {product.isCustomizable && (
                  <span className={styles.customBadge}>✦ Customisable</span>
                )}
              </div>
            </Link>
          ))}
        </div>
        )}

        <ProductImageLightbox
          isOpen={Boolean(imagePreview)}
          images={imagePreview?.images ?? []}
          activeIndex={imagePreview?.index ?? 0}
          onChangeIndex={(index) =>
            setImagePreview((previous) =>
              previous
                ? {
                    ...previous,
                    index,
                  }
                : previous
            )
          }
          onClose={() => setImagePreview(null)}
          productName={imagePreview?.productName ?? 'Product image'}
        />
      </div>
    </section>
  );
}


