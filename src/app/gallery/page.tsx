'use client';

import { useGalleryItems } from '@/lib/use-gallery-items';

export default function GalleryPage() {
  const { items, loading } = useGalleryItems();

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container">
        <span className="label-accent">Gallery</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0 1.25rem' }}>
          Before & After Transformations
        </h1>

        {loading ? <p style={{ color: '#A9B7C9' }}>Loading gallery...</p> : null}

        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {items.map((item, index) => (
            <article
              key={item.id}
              style={{
                background: '#163250',
                border: '1px solid rgba(181,146,65,0.18)',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 180 }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(181,146,65,0.1), rgba(181,146,65,0.02))',
                    borderRight: '1px solid rgba(255,255,255,0.08)',
                    padding: '0.8rem',
                  }}
                >
                  <p
                    style={{
                      color: '#B59241',
                      fontSize: '0.72rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Before
                  </p>
                  {item.beforeImage ? (
                    <img
                      src={item.beforeImage.secureUrl}
                      alt={item.beforeImage.alt || `${item.title} before`}
                      style={{ borderRadius: 10, height: 120, width: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ background: '#1E3C5F', borderRadius: 10, height: 120 }} />
                  )}
                </div>
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(78,205,196,0.1), rgba(78,205,196,0.02))',
                    padding: '0.8rem',
                  }}
                >
                  <p
                    style={{
                      color: '#4ECDC4',
                      fontSize: '0.72rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      marginBottom: '0.35rem',
                    }}
                  >
                    After
                  </p>
                  {item.afterImage ? (
                    <img
                      src={item.afterImage.secureUrl}
                      alt={item.afterImage.alt || `${item.title} after`}
                      style={{ borderRadius: 10, height: 120, width: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ background: '#2B2721', borderRadius: 10, height: 120 }} />
                  )}
                </div>
              </div>
              <div style={{ padding: '0.95rem 1rem' }}>
                <h2 style={{ color: '#EAF0F8', fontSize: '1rem', marginBottom: '0.2rem' }}>
                  Project {index + 1}: {item.project || item.title}
                </h2>
                <p style={{ color: '#A9B7C9', fontSize: '0.9rem' }}>{item.location}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
