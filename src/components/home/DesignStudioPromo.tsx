'use client';
import Link from 'next/link';
import { Wand2, Camera, Calendar } from 'lucide-react';
import { DESIGN_STUDIO_FEATURE } from '@/lib/features';
import styles from './DesignStudioPromo.module.css';

const tools = [
  { icon: Camera, label: 'Room Visualizer', desc: 'Upload a photo of your room and preview real furniture in place', href: '/design-studio/room-visualizer', color: '#B59241' },
  { icon: Wand2, label: 'Curtain Customizer', desc: 'Measure your windows, choose your options, and get an instant estimate', href: '/design-studio/curtain-customizer', color: '#4ECDC4' },
  { icon: Calendar, label: 'Book Installation', desc: 'Schedule professional installation at your preferred time', href: '/book-installation', color: '#FF8A65' },
];

export default function DesignStudioPromo() {
  const isDesignStudioDisabled = !DESIGN_STUDIO_FEATURE.enabled;

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.inner}>
          <div className={styles.left}>
            <span className="label-accent">Design Studio</span>
            <div className="gold-divider" style={{ margin: '0.75rem 0 1rem' }} />
            <h2 className="heading-xl" style={{ color: '#EAF0F8', marginBottom: '1.25rem' }}>
              Design Your Space<br />Before You Buy
            </h2>
            <p style={{ color: '#A9B7C9', fontSize: '1rem', lineHeight: '1.75', maxWidth: '420px', marginBottom: '2rem' }}>
              Our suite of free design tools helps you make confident decisions. Visualize furniture in your room, design custom curtains, and calculate exactly what you need.
            </p>
            {isDesignStudioDisabled ? (
              <button className={`${styles.comingSoonCta} btn btn-primary btn-lg`} type="button" disabled>
                Design Studio <span>{DESIGN_STUDIO_FEATURE.label}</span>
              </button>
            ) : (
              <Link href="/design-studio" className="btn btn-primary btn-lg">
                Open Design Studio
              </Link>
            )}
          </div>

          <div className={styles.right}>
            {tools.map(({ icon: Icon, label, desc, href, color }) =>
              isDesignStudioDisabled ? (
                <div key={href} className={`${styles.toolCard} ${styles.toolCardDisabled}`} aria-disabled="true">
                  <div className={styles.toolIcon} style={{ background: color + '18', border: `1px solid ${color}30` }}>
                    <Icon size={22} color={color} />
                  </div>
                  <div>
                    <h4 className={styles.toolLabel}>{label}</h4>
                    <p className={styles.toolDesc}>{desc}</p>
                  </div>
                  <span className={styles.comingSoonPill}>{DESIGN_STUDIO_FEATURE.label}</span>
                </div>
              ) : (
                <Link key={href} href={href} className={styles.toolCard}>
                  <div className={styles.toolIcon} style={{ background: color + '18', border: `1px solid ${color}30` }}>
                    <Icon size={22} color={color} />
                  </div>
                  <div>
                    <h4 className={styles.toolLabel}>{label}</h4>
                    <p className={styles.toolDesc}>{desc}</p>
                  </div>
                  <div className={styles.toolArrow} style={{ color }}>→</div>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
