'use client';

import { useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useGalleryItems, type GalleryItem } from '@/lib/use-gallery-items';
import ProductImageLightbox from '@/components/ui/ProductImageLightbox';
import styles from './projects.module.css';

const FILTERS = ['All', 'Furniture', 'Curtains', 'Blinds', 'WALLZ', 'DECKZ', 'Full Projects'] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_KEYWORDS: Record<Exclude<Filter, 'All'>, string[]> = {
  Furniture: ['furniture', 'sofa', 'lounge', 'bed', 'dining', 'upholster', 'cabinet'],
  Curtains: ['curtain', 'drape', 'sheer'],
  Blinds: ['blind', 'roller', 'zebra', 'venetian', 'roman', 'shutter'],
  WALLZ: ['wall', 'wallz', 'panel', 'cladding', 'slat'],
  DECKZ: ['deck', 'outdoor', 'patio', 'pool', 'balcony'],
  'Full Projects': ['full', 'complete', 'entire', 'renovation', 'makeover', 'refresh'],
};

function matchesFilter(item: GalleryItem, filter: Filter): boolean {
  if (filter === 'All') return true;
  const haystack = `${item.project} ${item.title}`.toLowerCase();
  return FILTER_KEYWORDS[filter].some((keyword) => haystack.includes(keyword));
}

export default function ProjectsPage() {
  const { items, loading } = useGalleryItems();
  const [filter, setFilter] = useState<Filter>('All');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxProject, setLightboxProject] = useState('');

  const visible = useMemo(() => items.filter((item) => matchesFilter(item, filter)), [items, filter]);

  const openLightbox = (project: string, index: number) => {
    setLightboxProject(project);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <span className="label-accent">Projects</span>
        <h1 className={styles.title}>ZHUA in Real Spaces</h1>
        <p className={styles.lede}>
          Completed transformations across furniture, curtains &amp; blinds, WALLZ and DECKZ — the
          result of one team handling the whole space.
        </p>

        <div className={styles.filters} role="group" aria-label="Filter projects by division">
          {FILTERS.map((label) => (
            <button
              key={label}
              type="button"
              className={`${styles.filter} ${filter === label ? styles.filterActive : ''}`}
              onClick={() => setFilter(label)}
              aria-pressed={filter === label}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`skeleton ${styles.skeletonCard}`} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className={styles.empty}>
            <p>
              No projects in this category yet. ZHUA completes new spaces every month — check back
              soon, or ask us about starting yours.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {visible.map((item, index) => (
              <article key={item.id} className={styles.card}>
                <div className={styles.pair}>
                  <button
                    type="button"
                    className={styles.imageBtn}
                    onClick={() =>
                      item.beforeImage && openLightbox(item.project || item.title, index * 2)
                    }
                    aria-label={`View larger before image of ${item.project || item.title}`}
                    disabled={!item.beforeImage}
                  >
                    {item.beforeImage ? (
                      <img
                        src={item.beforeImage.secureUrl}
                        alt={item.beforeImage.alt || `${item.title} before ZHUA`}
                        loading={index < 2 ? 'eager' : 'lazy'}
                        className={styles.image}
                      />
                    ) : (
                      <span className={styles.imageFallback} aria-hidden="true" />
                    )}
                    <span className={styles.pairLabel}>Before</span>
                  </button>
                  <button
                    type="button"
                    className={styles.imageBtn}
                    onClick={() =>
                      item.afterImage && openLightbox(item.project || item.title, index * 2 + 1)
                    }
                    aria-label={`View larger after image of ${item.project || item.title}`}
                    disabled={!item.afterImage}
                  >
                    {item.afterImage ? (
                      <img
                        src={item.afterImage.secureUrl}
                        alt={item.afterImage.alt || `${item.title} after ZHUA`}
                        loading={index < 2 ? 'eager' : 'lazy'}
                        className={styles.image}
                      />
                    ) : (
                      <span className={styles.imageFallback} aria-hidden="true" />
                    )}
                    <span className={`${styles.pairLabel} ${styles.pairLabelAfter}`}>After</span>
                  </button>
                </div>
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{item.project || item.title}</h2>
                  {item.location ? (
                    <p className={styles.cardLocation}>
                      <MapPin size={13} /> {item.location}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <ProductImageLightbox
        isOpen={lightboxOpen}
        images={visible.flatMap((item) =>
          [item.beforeImage?.secureUrl ?? '', item.afterImage?.secureUrl ?? ''].filter(Boolean)
        )}
        activeIndex={lightboxIndex}
        onChangeIndex={setLightboxIndex}
        onClose={() => setLightboxOpen(false)}
        productName={lightboxProject}
      />
    </div>
  );
}
