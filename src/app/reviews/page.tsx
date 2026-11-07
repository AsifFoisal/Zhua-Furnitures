import { Star } from 'lucide-react';
import { testimonials } from '@/lib/data';

export default function ReviewsPage() {
  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        <span className="label-accent">Customer Reviews</span>
        <h1 className="heading-xl" style={{ color: 'var(--text-primary)', margin: '1rem 0 1.5rem' }}>What <span className="heading-accent">Homeowners</span> Say About Zhua</h1>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {testimonials.map((review) => (
            <article key={review.id} style={{ background: 'var(--charcoal)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.7rem', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{review.name}</h2>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.86rem' }}>{review.location} · {review.project}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.2rem' }}>
                  {[...Array(review.rating)].map((_, i) => <Star key={i} size={14} fill="var(--gold)" color="var(--gold)" />)}
                </div>
              </div>
              <p style={{ color: '#D0C6B4', lineHeight: 1.75, marginTop: '0.7rem' }}>&quot;{review.text}&quot;</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
