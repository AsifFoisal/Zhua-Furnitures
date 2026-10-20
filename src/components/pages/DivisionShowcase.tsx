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

export default function DivisionShowcase({
  eyebrow,
  title,
  lede,
  items,
  source,
  motif,
  emptyNote,
}: DivisionShowcaseProps) {
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
            {items.map((item) => (
              <article key={item.id} className={styles.card}>
                <div className={styles.visual}>
                  <ImagePlaceholder
                    slot={
                      item.image
                        ? {
                            ...tileSlot(item.title, motif, item.category || 'ZHUA project'),
                            src: item.image.secureUrl,
                            alt: item.image.alt || item.title,
                          }
                        : tileSlot(item.title, motif, item.category || 'ZHUA project')
                    }
                    showCaption={!item.image}
                  />
                </div>
                <div className={styles.body}>
                  {item.category ? <span className={styles.category}>{item.category}</span> : null}
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  {item.description ? <p className={styles.description}>{item.description}</p> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
