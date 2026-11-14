'use client';

import { useMemo, useState } from 'react';
import CatalogFilterBar, { type CatalogTypeFilter } from './CatalogFilterBar';
import CatalogItemCard from './CatalogItemCard';
import CatalogDetailModal from './CatalogDetailModal';
import type { CatalogEntry } from '@/lib/wallz-deckz-catalog';
import styles from './WallzDeckzCatalog.module.css';

interface WallzDeckzCatalogProps {
  eyebrow: string;
  title: string;
  lede: string;
  /** Full catalog for this division — completed projects + pre-designed concepts. */
  entries: CatalogEntry[];
  emptyNote: string;
}

/**
 * Hybrid WALLZ/DECKZ catalog: filterable grid of completed projects and
 * pre-designed concepts with a full-cost detail modal per item. Data is passed
 * in from the server page so the section stays reusable for either division
 * (and for future CMS-sourced entries).
 */
export default function WallzDeckzCatalog({
  eyebrow,
  title,
  lede,
  entries,
  emptyNote,
}: WallzDeckzCatalogProps) {
  const [typeFilter, setTypeFilter] = useState<CatalogTypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selected, setSelected] = useState<CatalogEntry | null>(null);

  const typeCounts = useMemo(
    () => ({
      all: entries.length,
      completed: entries.filter((entry) => entry.kind === 'completed').length,
      concept: entries.filter((entry) => entry.kind === 'concept').length,
    }),
    [entries],
  );

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [entries]);

  const filtered = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (typeFilter === 'all' || entry.kind === typeFilter) &&
          (categoryFilter === 'all' || entry.category === categoryFilter),
      ),
    [entries, typeFilter, categoryFilter],
  );

  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className={`section-header ${styles.header}`}>
          <span className="label-accent">{eyebrow}</span>
          <h2 className="heading-lg">{title}</h2>
          <p className={styles.lede}>{lede}</p>
        </div>

        <CatalogFilterBar
          typeFilter={typeFilter}
          categoryFilter={categoryFilter}
          categories={categories}
          typeCounts={typeCounts}
          onChangeType={(type) => {
            setTypeFilter(type);
            setCategoryFilter('all');
          }}
          onChangeCategory={setCategoryFilter}
        />

        {filtered.length === 0 ? (
          <p className={styles.empty}>{emptyNote}</p>
        ) : (
          <div className={styles.grid}>
            {filtered.map((entry) => (
              <CatalogItemCard key={entry.id} entry={entry} onOpen={setSelected} />
            ))}
          </div>
        )}

        <CatalogDetailModal entry={selected} onClose={() => setSelected(null)} />
      </div>
    </section>
  );
}
