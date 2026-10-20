'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { useGalleryItems } from '@/lib/use-gallery-items';
import ProductImageLightbox from '@/components/ui/ProductImageLightbox';
import styles from './ProjectsGallery.module.css';

const FILTERS = ['All', 'Furniture', 'Curtains', 'Blinds', 'WALLZ', 'DECKZ', 'Full Projects'] as const;
type Filter = (typeof FILTERS)[number];

/** Gallery records don't carry a division field yet, so filters match keywords in the project/title text. */
const FILTER_KEYWORDS: Record<Exclude<Filter, 'All'>, string[]> = {
  Furniture: ['furniture', 'sofa', 'lounge', 'bed', 'dining', 'upholster', 'cabinet'],
  Curtains: ['curtain', 'drape', 'sheer'],
  Blinds: ['blind', 'roller', 'zebra', 'venetian', 'roman', 'shutter'],
  WALLZ: ['wall', 'wallz', 'panel', 'cladding', 'slat'],
  DECKZ: ['deck', 'outdoor', 'patio', 'pool', 'balcony'],
  'Full Projects': ['full', 'complete', 'entire', 'renovation', 'makeover', 'refresh'],
};

function matchesFilter(item: { project: string; title: string }, filter: Filter): boolean {
  if (filter === 'All') return true;
  const haystack = `${item.project} ${item.title}`.toLowerCase();
  return FILTER_KEYWORDS[filter].some((keyword) => haystack.includes(keyword));
}

export default function ProjectsGallery() {
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
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className={styles.header}>
          <div className="section-header" style={{ marginBottom: 0 }}>
            <span className="label-accent">Projects</span>
            <h2 className="heading-xl">See ZHUA in Real Spaces</h2>
          </div>
          <Link href="/projects" className={styles.viewAll}>
            View all projects <ArrowRight size={15} />
          </Link>
        </div>

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
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`skeleton ${styles.skeletonCard}`} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className={styles.empty}>
            <p>
              No projects in this category yet. ZHUA completes new spaces every month — check back
              soon or explore the full gallery.
            </p>
            <Link href="/gallery" className="btn btn-outline btn-sm">
              Open the Gallery
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {visible.slice(0, 6).map((item, index) => {
              const image = item.afterImage ?? item.beforeImage;
              return (
                <article key={item.id} className={styles.card}>
                  <button
                    type="button"
                    className={styles.imageBtn}
                    onClick={() => image && openLightbox(item.project || item.title, index)}
                    aria-label={image ? `View larger image of ${item.project || item.title}` : undefined}
                    disabled={!image}
                  >
                    {image ? (
                      <img
                        src={image.secureUrl}
                        alt={image.alt || `${item.project || item.title} completed by ZHUA`}
                        loading={index < 3 ? 'eager' : 'lazy'}
                        className={styles.image}
                      />
                    ) : (
                      <span className={styles.imageFallback} aria-hidden="true" />
                    )}
                  </button>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{item.project || item.title}</h3>
                    {item.location ? (
                      <p className={styles.cardLocation}>
                        <MapPin size={13} /> {item.location}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <ProductImageLightbox
        isOpen={lightboxOpen}
        images={visible.map((item) => item.afterImage?.secureUrl ?? item.beforeImage?.secureUrl ?? '')}
        activeIndex={lightboxIndex}
        onChangeIndex={setLightboxIndex}
        onClose={() => setLightboxOpen(false)}
        productName={lightboxProject}
      />
    </section>
  );
}
