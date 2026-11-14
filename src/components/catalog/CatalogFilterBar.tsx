'use client';

import { CATALOG_KIND_LABEL, type CatalogKind } from '@/lib/wallz-deckz-catalog';
import styles from './CatalogFilterBar.module.css';

export type CatalogTypeFilter = 'all' | CatalogKind;

interface CatalogFilterBarProps {
  typeFilter: CatalogTypeFilter;
  categoryFilter: string;
  categories: { label: string; count: number }[];
  typeCounts: Record<CatalogTypeFilter, number>;
  onChangeType: (type: CatalogTypeFilter) => void;
  onChangeCategory: (category: string) => void;
}

const TYPE_TABS: { value: CatalogTypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: CATALOG_KIND_LABEL.completed },
  { value: 'concept', label: CATALOG_KIND_LABEL.concept },
];

/**
 * Two-tier filter for the hybrid catalog: type tabs (All / Completed /
 * Pre-Designed) above horizontally scrollable sub-category pills.
 */
export default function CatalogFilterBar({
  typeFilter,
  categoryFilter,
  categories,
  typeCounts,
  onChangeType,
  onChangeCategory,
}: CatalogFilterBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.typeRow} role="tablist" aria-label="Filter by project type">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={typeFilter === tab.value}
            className={`${styles.typeTab} ${typeFilter === tab.value ? styles.typeTabActive : ''}`}
            onClick={() => onChangeType(tab.value)}
          >
            {tab.label}
            <span className={styles.count}>{typeCounts[tab.value]}</span>
          </button>
        ))}
      </div>

      <div className={styles.categoryRow} aria-label="Filter by sub-category">
        <button
          type="button"
          className={`${styles.categoryPill} ${categoryFilter === 'all' ? styles.categoryPillActive : ''}`}
          onClick={() => onChangeCategory('all')}
        >
          All styles
        </button>
        {categories.map((category) => (
          <button
            key={category.label}
            type="button"
            className={`${styles.categoryPill} ${categoryFilter === category.label ? styles.categoryPillActive : ''}`}
            onClick={() => onChangeCategory(category.label)}
          >
            {category.label}
            <span className={styles.count}>{category.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
