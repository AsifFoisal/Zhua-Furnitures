'use client';

/**
 * Product card skeleton shown while products load or an image is missing.
 * Uses the global `.skeleton` shimmer class from globals.css.
 */
export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{
        borderRadius: '14px',
        overflow: 'hidden',
        background: 'var(--surface-1)',
        border: '1px solid var(--surface-border)',
      }}
    >
      <div className="skeleton" style={{ aspectRatio: '4 / 3', borderRadius: 0 }} />
      <div style={{ padding: '1rem', display: 'grid', gap: '0.6rem' }}>
        <div className="skeleton" style={{ height: '12px', width: '40%' }} />
        <div className="skeleton" style={{ height: '16px', width: '82%' }} />
        <div className="skeleton" style={{ height: '14px', width: '55%' }} />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading products"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '1.25rem',
      }}
      className="product-skeleton-grid"
    >
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
