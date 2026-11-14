'use client';

import { ArrowUpRight, MapPin, Clock3 } from 'lucide-react';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import { tileSlot, type ImageryMotif } from '@/lib/home-imagery';
import {
  CATALOG_KIND_LABEL,
  formatCatalogPrice,
  type CatalogEntry,
} from '@/lib/wallz-deckz-catalog';
import styles from './CatalogItemCard.module.css';

interface CatalogItemCardProps {
  entry: CatalogEntry;
  onOpen: (entry: CatalogEntry) => void;
}

export default function CatalogItemCard({ entry, onOpen }: CatalogItemCardProps) {
  const motif: ImageryMotif = entry.division === 'wallz' ? 'wall' : 'deck';
  const hero = entry.gallery[0];
  const metaLine = entry.location
    ? { icon: MapPin, text: `${entry.location} · ${entry.completedYear ?? ''}`.replace(/ ·$/, '') }
    : entry.leadTime
      ? { icon: Clock3, text: entry.leadTime }
      : null;

  return (
    <article className={styles.card}>
      <button
        type="button"
        className={styles.visualButton}
        onClick={() => onOpen(entry)}
        aria-label={`View full details of ${entry.title}`}
      >
        <div className={styles.visual}>
          {hero ? (
            <img src={hero.src} alt={hero.alt} loading="lazy" className={styles.image} />
          ) : (
            <ImagePlaceholder
              slot={tileSlot(entry.title, motif, entry.category)}
              showCaption={false}
              className={styles.placeholder}
            />
          )}
          <span className={`${styles.badge} ${entry.kind === 'completed' ? styles.badgeCompleted : styles.badgeConcept}`}>
            {CATALOG_KIND_LABEL[entry.kind]}
          </span>
        </div>
      </button>

      <div className={styles.body}>
        <span className={styles.category}>{entry.category}</span>
        <h3 className={styles.title}>{entry.title}</h3>
        <p className={styles.summary}>{entry.summary}</p>
        {metaLine ? (
          <span className={styles.meta}>
            <metaLine.icon size={13} />
            {metaLine.text}
          </span>
        ) : null}
        <div className={styles.footer}>
          <span className={styles.price}>{formatCatalogPrice(entry)}</span>
          <button type="button" className={styles.detailsButton} onClick={() => onOpen(entry)}>
            View Full Details <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
