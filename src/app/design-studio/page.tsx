import Link from 'next/link';
import ComingSoonPanel from '@/components/ui/ComingSoonPanel';
import { DESIGN_STUDIO_FEATURE } from '@/lib/features';

const tools = [
  {
    title: 'Room Visualizer',
    desc: 'Upload a room photo and place furniture overlays.',
    href: '/design-studio/room-visualizer',
  },
  {
    title: 'Curtain Customizer',
    desc: 'Choose fabric, heading style, lining, and preview instantly.',
    href: '/design-studio/curtain-customizer',
  },
  {
    title: 'Curtain Calculator',
    desc: 'Calculate fabric metres, estimate total cost, and prepare your quote.',
    href: '/design-studio/calculator',
  },
];

export default function DesignStudioPage() {
  if (!DESIGN_STUDIO_FEATURE.enabled) {
    return (
      <ComingSoonPanel
        title="Design Studio Is Getting an Upgrade"
        message={DESIGN_STUDIO_FEATURE.message}
        primaryCta={{ label: 'Shop Collection', href: '/shop' }}
        secondaryCta={{ label: 'Browse Gallery', href: '/gallery' }}
      />
    );
  }

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container">
        <span className="label-accent">Design Studio</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0 1.25rem' }}>Plan Your Space With Interactive Tools</h1>

        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {tools.map((tool) => (
            <article key={tool.title} style={{ background: '#163250', border: '1px solid rgba(181,146,65,0.18)', borderRadius: 14, padding: '1.1rem', display: 'grid', gap: '0.9rem' }}>
              <div>
                <h2 className="heading-md" style={{ color: '#EAF0F8', fontSize: '1.22rem', marginBottom: '0.35rem' }}>{tool.title}</h2>
                <p style={{ color: '#A9B7C9', fontSize: '0.92rem', lineHeight: 1.7 }}>{tool.desc}</p>
              </div>
              <Link href={tool.href} className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }}>Open Tool</Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
