'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Star, SlidersHorizontal, X, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { categories, formatPrice } from '@/lib/data';
import ProductImageLightbox from '@/components/ui/ProductImageLightbox';
import { useCartStore, useWishlistStore } from '@/store';
import { useStorefrontProducts } from '@/lib/use-storefront-products';
import { ProductGridSkeleton } from '@/components/ui/ProductCardSkeleton';
import styles from './page.module.css';

type ImagePreviewState = {
  productName: string;
  images: string[];
  index: number;
};

function toPreviewImages(images: string[]): string[] {
  return images.filter((image) => typeof image === 'string' && image.trim().length > 0);
}

export default function ShopPage() {
  const { products, loading } = useStorefrontProducts();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [imagePreview, setImagePreview] = useState<ImagePreviewState | null>(null);
  const { addItem } = useCartStore();
  const { toggle, has } = useWishlistStore();

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

  const allSubcategories = useMemo(
    () => [...new Set(products.map((product) => product.subcategory))],
    [products]
  );

  const filtered = products
    .filter(p => selectedCategory === 'all' || p.category === selectedCategory)
    .filter(p => selectedSubcategory === 'all' || p.subcategory === selectedSubcategory)
    .filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.hero}>
        <div className="container">
          <span className="label-accent">Our Collection</span>
          <h1 className={`heading-xl ${styles.heroTitle}`}>Shop All <span className="heading-accent">Products</span></h1>
          <p className={styles.heroDesc}>Premium furniture, curtains, blinds, and home accessories — delivered anywhere in South Africa</p>
        </div>
      </div>

      <div className="container">
        <div className={styles.layout}>
          {/* Sidebar Filters */}
          <aside className={`${styles.sidebar} ${showFilters ? styles.sidebarOpen : ''}`}>
            <div className={styles.filterHeader}>
              <h3 className={styles.filterTitle}>Filters</h3>
              <button className={styles.closeFilters} onClick={() => setShowFilters(false)}><X size={18} /></button>
            </div>

            <div className={styles.filterGroup}>
              <h4 className={styles.filterGroupTitle}>Category</h4>
              {[{ id: 'all', name: 'All Products' }, ...categories].map(cat => (
                <button
                  key={cat.id}
                  className={`${styles.filterOption} ${selectedCategory === cat.id ? styles.filterActive : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className={styles.filterGroup}>
              <h4 className={styles.filterGroupTitle}>Type</h4>
              {['all', ...allSubcategories].map(sub => (
                <button
                  key={sub}
                  className={`${styles.filterOption} ${selectedSubcategory === sub ? styles.filterActive : ''}`}
                  onClick={() => setSelectedSubcategory(sub)}
                >
                  {sub === 'all' ? 'All Types' : sub}
                </button>
              ))}
            </div>

            <div className={styles.filterGroup}>
              <h4 className={styles.filterGroupTitle}>Max Price: {formatPrice(priceRange[1])}</h4>
              <input
                type="range" min={0} max={50000} step={500}
                value={priceRange[1]}
                onChange={e => setPriceRange([0, Number(e.target.value)])}
                className={styles.priceSlider}
              />
              <div className={styles.priceLabels}>
                <span>{formatPrice(0)}</span>
                <span>{formatPrice(50000)}</span>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className={styles.main}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                <button className={styles.filterToggle} onClick={() => setShowFilters(true)}>
                  <SlidersHorizontal size={16} /> Filters
                </button>
                <span className={styles.resultCount}>{filtered.length} products</span>
              </div>
              <div className={styles.sortWrap}>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className={styles.sortSelect}
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            {/* Category Pills */}
            <div className={styles.categoryPills}>
              {[{ id: 'all', name: 'All' }, ...categories].map(cat => (
                <button
                  key={cat.id}
                  className={`${styles.pill} ${selectedCategory === cat.id ? styles.pillActive : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Grid */}
            {loading ? (
              <ProductGridSkeleton count={9} />
            ) : (
            <div className={styles.grid}>
              {filtered.map(product => (
                <Link key={product.id} href={`/product/${product.slug}`} className={styles.card}>
                  <div className={styles.cardImage}>
                    <div className={styles.cardImageInner}>
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
                    {product.badge && (
                      <span className={`badge badge-${product.badge} ${styles.cardBadge}`}>
                        {product.badge === 'bestseller' ? '🏆' : ''} {product.badge}
                      </span>
                    )}
                    <div className={styles.cardActions}>
                      <button
                        className={`${styles.cardActionBtn} ${has(product.id) ? styles.wishlisted : ''}`}
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
                      ><Heart size={15} fill={has(product.id) ? 'currentColor' : 'none'} /></button>
                    </div>
                    {product.images[0] ? (
                      <button
                        type="button"
                        className={styles.cardZoomBtn}
                        aria-label={`Preview ${product.name} image`}
                        onClick={(event) => openImagePreview(product.name, product.images, event)}
                      >
                        <ZoomIn size={15} />
                      </button>
                    ) : null}
                    <button
                      className={`${styles.cardQuickAdd} ${!product.inStock ? styles.cardQuickAddOutOfStock : ''}`}
                      disabled={!product.inStock}
                      aria-label={product.inStock ? 'Add to cart' : 'Out of stock'}
                      onClick={e => {
                        e.preventDefault();
                        if (!product.inStock) {
                          toast.error(`${product.name} is out of stock.`);
                          return;
                        }

                        addItem({
                          product,
                          quantity: 1,
                          selectedColor: product.colors[0]?.name ?? 'Default',
                        });
                        toast.success(`${product.name} added to cart.`);
                      }}
                    ><ShoppingBag size={13} /> {product.inStock ? 'Add to Cart' : 'Out of Stock'}</button>
                  </div>
                  <div className={styles.cardBody}>
                    <p className={styles.cardSub}>{product.subcategory}</p>
                    <h3 className={styles.cardName}>{product.name}</h3>
                    <div className={styles.cardRating}>
                      {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < Math.floor(product.rating) ? 'var(--gold)' : 'none'} color="var(--gold)" />)}
                      <span>({product.reviewCount})</span>
                    </div>
                    <div className={styles.cardPrice}>
                      <span className={styles.price}>{formatPrice(product.price)}</span>
                      {product.originalPrice && <span className={styles.original}>{formatPrice(product.originalPrice)}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className={styles.empty}>
                <p>No products match your filters.</p>
                <button className="btn btn-outline btn-sm" onClick={() => { setSelectedCategory('all'); setSelectedSubcategory('all'); setPriceRange([0, 50000]); }}>
                  Clear Filters
                </button>
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
        </div>
      </div>
    </div>
  );
}


