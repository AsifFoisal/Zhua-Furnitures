import { tileSlot, type ImageryMotif } from '@/lib/home-imagery';
import type { DivisionItem } from '@/lib/division-items';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import styles from './DivisionShowcase.module.css';

interface DivisionShowcaseProps {
  eyebrow: string;
  title: string;
  lede: string;
  items: DivisionItem[];
  /** Rendered when content comes from built-in demo data instead of the database. */
  source: 'database' | 'fallback';
  motif: ImageryMotif;
  emptyNote: string;
}

/**
 * Local photography used while a showcase item has no uploaded image. Admin
 * uploads replace these automatically because item.image takes precedence.
 */
const FALLBACK_IMAGES: Partial<Record<ImageryMotif, { src: string; alt: string }[]>> = {
  wall: [
    { src: '/images/zhua/showcase-wallz-slat-partition.jpg', alt: 'Slat wall panelling behind a dining area' },
    { src: '/images/zhua/wallz-media-wall-warm.jpg', alt: 'Warm media wall with a built-in TV niche' },
    { src: '/images/zhua/showcase-wallz-headboard.jpg', alt: 'Bedroom with a panelled headboard wall' },
    { src: '/images/zhua/showcase-wallz-accent.jpg', alt: 'Accent wall in a styled lounge' },
    { src: '/images/zhua/showcase-wallz-formal.jpg', alt: 'Wall panelling and built-ins in a formal reception space' },
    { src: '/images/zhua/showcase-wallz-builtins.jpg', alt: 'Wood-look wall cladding with built-in cabinetry' },
  ],
  deck: [
    { src: '/images/zhua/showcase-deckz-terrace.jpg', alt: 'Outdoor terrace deck with pool and lounge seating' },
    { src: '/images/zhua/showcase-deckz-pool.jpg', alt: 'Pool deck wrapping around a modern swimming pool' },
    { src: '/images/zhua/showcase-deckz-balcony.jpg', alt: 'Elevated balcony deck with outdoor seating' },
    { src: '/images/zhua/showcase-deckz-patio.jpg', alt: 'Covered patio with decking and outdoor lounge furniture' },
    { src: '/images/zhua/showcase-deckz-garden.jpg', alt: 'Outdoor platform and garden paving at a modern home' },
    { src: '/images/zhua/showcase-deckz-residential.jpg', alt: 'Residential deck and lawn leading to the water' },
  ],
};

export default function DivisionShowcase({
  eyebrow,
  title,
  lede,
  items,
  source,
  motif,
  emptyNote,
}: DivisionShowcaseProps) {
  const fallbacks = FALLBACK_IMAGES[motif] ?? [];

  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className={styles.header}>
          <div className="section-header" style={{ marginBottom: 0 }}>
            <span className="label-accent">{eyebrow}</span>
            <h2 className="heading-lg">{title}</h2>
          </div>
          <p className={styles.lede}>{lede}</p>
        </div>

        {source === 'fallback' ? (
          <p className={styles.sourceNote}>
            Showing demo content — items added in the admin panel will appear here automatically.
          </p>
        ) : null}

        {items.length === 0 ? (
          <p className={styles.empty}>{emptyNote}</p>
        ) : (
          <div className={styles.grid}>
            {items.map((item, index) => {
              const fallback = fallbacks.length > 0 ? fallbacks[index % fallbacks.length] : null;
              const imageSrc = item.image?.secureUrl ?? fallback?.src;
              const imageAlt = item.image?.alt || fallback?.alt || item.title;

              return (
                <article key={item.id} className={styles.card}>
                  <div className={styles.visual}>
                    <ImagePlaceholder
                      slot={{
                        ...tileSlot(item.title, motif, item.category || 'ZHUA project'),
                        src: imageSrc,
                        alt: imageAlt,
                      }}
                      showCaption={!imageSrc}
                    />
                  </div>
                  <div className={styles.body}>
                    {item.category ? <span className={styles.category}>{item.category}</span> : null}
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    {item.description ? <p className={styles.description}>{item.description}</p> : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
