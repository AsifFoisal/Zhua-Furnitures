'use client';
import { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { testimonials as fallbackTestimonials } from '@/lib/data';
import styles from './Testimonials.module.css';

interface CloudinaryImageAsset {
  publicId: string;
  secureUrl: string;
  alt: string;
}

interface TestimonialItem {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  project: string;
  avatarImage: CloudinaryImageAsset | null;
}

function toInitialState(): TestimonialItem[] {
  return fallbackTestimonials.map((item) => ({
    id: String(item.id),
    name: item.name,
    location: item.location,
    rating: item.rating,
    text: item.text,
    project: item.project,
    avatarImage: null,
  }));
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(toInitialState());
  const [active, setActive] = useState(0);

  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        const res = await fetch('/api/testimonials', { cache: 'no-store' });
        const data = (await res.json()) as { testimonials?: TestimonialItem[] };
        if (Array.isArray(data.testimonials) && data.testimonials.length > 0) {
          setTestimonials(data.testimonials);
          setActive(0);
        }
      } catch {
        // Keep fallback testimonials if API fetch fails.
      }
    };

    void loadTestimonials();
  }, []);

  const t = testimonials[active];

  if (!t) {
    return null;
  }

  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className={styles.inner}>
          <div className={styles.left}>
            <span className="label-accent">Real Clients, Real Rooms</span>
            <div className="gold-divider" style={{ margin: '0.75rem 0 1rem' }} />
            <h2 className="heading-xl" style={{ color: '#EAF0F8', marginBottom: '2rem' }}>
              What Our <span className="heading-accent">Clients Say</span>
            </h2>
            <div className={styles.thumbs}>
              {testimonials.map((t, i) => (
                <button
                  key={t.id}
                  className={`${styles.thumb} ${i === active ? styles.thumbActive : ''}`}
                  onClick={() => setActive(i)}
                  aria-label={`View testimonial from ${t.name}`}
                >
                  {t.avatarImage ? (
                    <img
                      src={t.avatarImage.secureUrl}
                      alt={t.avatarImage.alt || t.name}
                      className={styles.thumbAvatar}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className={styles.thumbAvatar} style={{ background: `hsl(${i * 60 + 20}, 40%, 40%)` }}>
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className={styles.thumbName}>{t.name}</div>
                    <div className={styles.thumbLoc}>{t.location}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.quoteCard} key={active}>
              <Quote size={36} className={styles.quoteIcon} />
              <div className={styles.stars}>
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={16} fill="#B59241" color="#B59241" />
                ))}
              </div>
              <blockquote className={styles.quoteText}>&ldquo;{t.text}&rdquo;</blockquote>
              <div className={styles.quoteAuthor}>
                {t.avatarImage ? (
                  <img
                    src={t.avatarImage.secureUrl}
                    alt={t.avatarImage.alt || t.name}
                    className={styles.authorAvatar}
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className={styles.authorAvatar} style={{ background: `hsl(${active * 60 + 20}, 40%, 40%)` }}>
                    {t.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className={styles.authorName}>{t.name}</div>
                  <div className={styles.authorMeta}>{t.location} · {t.project}</div>
                </div>
              </div>
            </div>

            <div className={styles.dots}>
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
                  onClick={() => setActive(i)}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
