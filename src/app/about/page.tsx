export default function AboutPage() {
  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <span className="label-accent">About Zhua Furniture</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0 1.25rem' }}>South Africa&apos;s <span className="heading-accent">Premium</span> Home Solutions Platform</h1>
        <p style={{ color: '#A9B7C9', fontSize: '1.02rem', lineHeight: 1.8, marginBottom: '2rem' }}>
          Zhua Furniture was built to make premium home transformations accessible across all 9 provinces. We combine curated furniture, custom curtains and blinds, and design-led services to help you create spaces that feel timeless, intentional, and deeply personal.
        </p>

        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '2rem' }}>
          {[
            { title: 'Nationwide Delivery', text: 'Reliable doorstep delivery with province-based logistics.' },
            { title: 'Custom Solutions', text: 'Tailored curtains, finishes, and made-to-fit products.' },
            { title: 'Design Expertise', text: 'Guidance from concept to final styling and installation.' },
          ].map((item) => (
            <article key={item.title} style={{ background: '#163250', border: '1px solid rgba(181,146,65,0.18)', borderRadius: 14, padding: '1.1rem' }}>
              <h2 className="heading-md" style={{ color: '#EAF0F8', fontSize: '1.2rem', marginBottom: '0.4rem' }}>{item.title}</h2>
              <p style={{ color: '#A9B7C9', fontSize: '0.95rem' }}>{item.text}</p>
            </article>
          ))}
        </div>

        <div style={{ background: '#163250', border: '1px solid rgba(181,146,65,0.2)', borderRadius: 14, padding: '1.25rem' }}>
          <h3 className="heading-md" style={{ color: '#EAF0F8', marginBottom: '0.5rem' }}>Our Promise</h3>
          <p style={{ color: '#A9B7C9', lineHeight: 1.8 }}>
            Every order is backed by premium quality standards, transparent communication, and WhatsApp-first support. Whether you are furnishing one room or redesigning your whole home, we are committed to delivering confidence, comfort, and craftsmanship.
          </p>
        </div>
      </div>
    </div>
  );
}
