'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Armchair,
  BedDouble,
  ImageOff,
  MessageCircle,
  Ruler,
  ShieldCheck,
  Sofa,
  Star,
  Trees,
  Truck,
  Tv,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import { formatPrice, type Product } from '@/lib/data';
import { homeImagery } from '@/lib/home-imagery';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import styles from './FurnitureLanding.module.css';

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'rating';

const PAGE_SIZE = 9;

interface FurnitureLandingProps {
  initialProducts: Product[];
}

interface CraftHighlight {
  title: string;
  description: string;
  icon: LucideIcon;
}

const craftHighlights: CraftHighlight[] = [
  {
    title: 'Sofas & Lounges',
    description: 'Statement pieces with custom sizes, fabrics and configurations.',
    icon: Sofa,
  },
  {
    title: 'Modular Sofas',
    description: 'Flexible seating that adapts to your room and the way you live.',
    icon: Armchair,
  },
  {
    title: 'Beds & Headboards',
    description: 'Upholstered beds and headboards made to your exact dimensions.',
    icon: BedDouble,
  },
  {
    title: 'Dining',
    description: 'Tables and seating for everyday meals and easy entertaining.',
    icon: UtensilsCrossed,
  },
  {
    title: 'TV Units & Cabinets',
    description: 'Custom cabinetry and media units tailored to your walls.',
    icon: Tv,
  },
  {
    title: 'Outdoor & Reupholstery',
    description: 'Outdoor furniture and a new lease on life for pieces you love.',
    icon: Trees,
  },
];

const processSteps = [
  {
    title: 'Measure & brief',
    description: 'We visit your space, take proper measurements and talk through how the room needs to work.',
  },
  {
    title: 'Design & quote',
    description: 'You get a clear design, fabric and finish selection and transparent pricing before we start.',
  },
  {
    title: 'Built in our workshop',
    description: 'Your piece is manufactured by our own team — no middlemen, no surprises.',
  },
  {
    title: 'Delivered & installed',
    description: 'We deliver, assemble and place the piece so the room is ready to live in.',
  },
];

const badgeLabels: Record<NonNullable<Product['badge']>, string> = {
  bestseller: 'Bestseller',
  custom: 'Custom',
  new: 'New',
  sale: 'Sale',
};

/** Request a grid-sized Cloudinary derivative instead of the full-size original. */
function thumbnailUrl(url: string, width = 720): string {
  if (!url.includes('/image/upload/')) {
    return url;
  }

  return url.replace('/image/upload/', `/image/upload/w_${width},c_fill,q_auto,f_auto/`);
}

function sortProducts(products: Product[], sortBy: SortKey): Product[] {
  const sorted = [...products];

  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    default:
      return sorted;
  }
}

function productTypeLabel(product: Product): string {
  return (product.subcategory ?? '').trim() || 'Other';
}

export default function FurnitureLanding({ initialProducts }: FurnitureLandingProps) {
  const [activeType, setActiveType] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('featured');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const furniture = useMemo(
    () => initialProducts.filter((product) => product.category === 'furniture'),
    [initialProducts]
  );

  const types = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();

    furniture.forEach((product) => {
      const label = productTypeLabel(product);
      const key = label.toLowerCase();
      const existing = counts.get(key);

      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, { label, count: 1 });
      }
    });

    return [...counts.entries()]
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [furniture]);

  const activeTypeLabel =
    activeType === 'all' ? 'all pieces' : types.find((type) => type.key === activeType)?.label;

  const visibleProducts = useMemo(() => {
    const filtered =
      activeType === 'all'
        ? furniture
        : furniture.filter(
            (product) => productTypeLabel(product).toLowerCase() === activeType
          );

    return sortProducts(filtered, sortBy);
  }, [activeType, furniture, sortBy]);

  const pagedProducts = visibleProducts.slice(0, visibleCount);
  const hasMore = visibleProducts.length > visibleCount;

  const selectType = (key: string) => {
    setActiveType(key);
    setVisibleCount(PAGE_SIZE);
  };

  const changeSort = (key: SortKey) => {
    setSortBy(key);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrowRow}>
              <span className={styles.eyebrowRule} aria-hidden="true" />
              <span className="label-accent">ZHUA Furniture</span>
            </div>
            <h1 className={styles.title}>
              Furniture made
              <br />
              <em>around you.</em>
            </h1>
            <p className={styles.description}>
              From statement modular sofas to dining furniture, beds, TV units and custom cabinetry —
              every ZHUA piece is designed around your space, your style and how you live.
            </p>
            <div className={styles.ctaGroup}>
              <a href="#collection" className="btn btn-primary">
                Browse the Collection <ArrowDown size={16} />
              </a>
              <Link href="/contact" className="btn btn-outline">
                Request Custom Furniture
              </Link>
            </div>
            <ul className={styles.heroNotes}>
              <li>
                <Ruler size={15} aria-hidden="true" /> Made to measure
              </li>
              <li>
                <ShieldCheck size={15} aria-hidden="true" /> Built in our workshop
              </li>
              <li>
                <Truck size={15} aria-hidden="true" /> Delivery &amp; install
              </li>
            </ul>
          </div>

          <div className={styles.heroVisualWrap}>
            <div className={styles.heroVisual}>
              <ImagePlaceholder
                slot={homeImagery.divisionFurniture}
                loading="eager"
                showCaption={false}
              />
              <div className={styles.heroStamp}>
                <span>Crafted by ZHUA</span>
                <strong>One team, from first sketch to final install</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="collection" className={`section ${styles.collection}`}>
        <div className="container">
          <div className={styles.collectionHead}>
            <div>
              <span className="label-accent">The Collection</span>
              <h2 className={styles.sectionTitle}>Pieces ready to order</h2>
            </div>
            <p className={styles.sectionLede}>
              Browse the range, then make it yours. Most pieces can be resized, reupholstered or
              finished in the material that suits your room.
            </p>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.filters} role="group" aria-label="Filter furniture by type">
              <button
                type="button"
                className={`${styles.filterChip} ${activeType === 'all' ? styles.filterChipActive : ''}`}
                aria-pressed={activeType === 'all'}
                onClick={() => selectType('all')}
              >
                All pieces
                <span className={styles.filterCount}>{furniture.length}</span>
              </button>
              {types.map((type) => (
                <button
                  key={type.key}
                  type="button"
                  className={`${styles.filterChip} ${activeType === type.key ? styles.filterChipActive : ''}`}
                  aria-pressed={activeType === type.key}
                  onClick={() => selectType(type.key)}
                >
                  {type.label}
                  <span className={styles.filterCount}>{type.count}</span>
                </button>
              ))}
            </div>

            <label className={styles.sort}>
              <span>Sort by</span>
              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={(event) => changeSort(event.target.value as SortKey)}
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
            </label>
          </div>

          <p className={styles.resultCount} aria-live="polite">
            Showing {pagedProducts.length} of {visibleProducts.length}{' '}
            {visibleProducts.length === 1 ? 'piece' : 'pieces'}
            {activeType !== 'all' && activeTypeLabel ? ` in ${activeTypeLabel}` : ''}
          </p>

          {visibleProducts.length === 0 ? (
            <div className={styles.empty}>
              <ImageOff size={26} aria-hidden="true" />
              <p>No furniture pieces in this selection yet — check back soon.</p>
            </div>
          ) : (
            <div className={styles.productGrid}>
              {pagedProducts.map((product) => {
                const image = product.images[0];

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className={styles.card}
                  >
                    <div className={styles.cardVisual}>
                      {image ? (
                        <img
                          src={thumbnailUrl(image)}
                          alt={product.name}
                          loading="lazy"
                          className={styles.cardImage}
                        />
                      ) : (
                        <div className={styles.cardFallback} aria-hidden="true">
                          <ImageOff size={30} />
                        </div>
                      )}
                      {product.badge ? (
                        <span className={`badge badge-${product.badge} ${styles.cardBadge}`}>
                          {badgeLabels[product.badge] ?? product.badge}
                        </span>
                      ) : null}
                      <div className={styles.cardOverlay}>
                        <span className={styles.cardCta}>
                          View piece <ArrowUpRight size={14} />
                        </span>
                      </div>
                    </div>

                    <div className={styles.cardBody}>
                      <p className={styles.cardSub}>{product.subcategory || 'Furniture'}</p>
                      <h3 className={styles.cardName}>{product.name}</h3>
                      <div className={styles.cardMeta}>
                        <span className={styles.rating}>
                          <Star size={12} fill="currentColor" aria-hidden="true" />
                          {Number(product.rating || 0).toFixed(1)}
                          <em>({product.reviewCount})</em>
                        </span>
                        {product.isCustomizable ? (
                          <span className={styles.customTag}>Customisable</span>
                        ) : null}
                      </div>
                      <div className={styles.cardPriceRow}>
                        <span className={styles.price}>{formatPrice(product.price)}</span>
                        {product.originalPrice ? (
                          <span className={styles.original}>
                            {formatPrice(product.originalPrice)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {hasMore ? (
            <div className={styles.loadMoreWrap}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Show more pieces <ArrowDown size={16} />
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className={`section ${styles.craftSection}`}>
        <div className="container">
          <div className={styles.craftHead}>
            <span className="label-accent">What We Make</span>
            <h2 className={styles.sectionTitle}>One workshop, every room</h2>
            <p className={styles.sectionLede}>
              Sofas, beds, dining, storage and the pieces that pull a room together — designed,
              built and finished under one roof.
            </p>
          </div>

          <div className={styles.craftGrid}>
            {craftHighlights.map((item, index) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className={styles.craftCard}>
                  <span className={styles.craftIndex} aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={styles.craftIcon}>
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={`section ${styles.processSection}`}>
        <div className="container">
          <div className={styles.processInner}>
            <div className={styles.processCopy}>
              <span className="label-accent">How It Works</span>
              <h2 className={styles.sectionTitle}>From first measurement to final install</h2>
              <p className={styles.sectionLede}>
                A single team handles the whole piece — so the design you approve is the furniture
                that arrives.
              </p>
              <Link href="/book-installation" className={styles.processLink}>
                Book a site measurement <ArrowRight size={15} />
              </Link>
            </div>

            <ol className={styles.processSteps}>
              {processSteps.map((step, index) => (
                <li key={step.title} className={styles.processStep}>
                  <span className={styles.processNumber} aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className={`section-sm ${styles.quoteSection}`}>
        <div className="container">
          <div className={styles.quoteInner}>
            <div>
              <h2 className={styles.quoteTitle}>Have a piece in mind?</h2>
              <p className={styles.quoteText}>
                Send us a photo, a sketch or your measurements and we&apos;ll turn it into a quote.
              </p>
            </div>
            <div className={styles.quoteActions}>
              <Link href="/contact" className="btn btn-primary">
                Get a Quote <ArrowRight size={16} />
              </Link>
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
              >
                <MessageCircle size={16} /> WhatsApp ZHUA
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
