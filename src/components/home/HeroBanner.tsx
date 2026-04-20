'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import styles from './HeroBanner.module.css';

export default function HeroBanner() {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    const t = setTimeout(() => {
      el.style.transition = 'opacity 0.9s ease, transform 0.9s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className={styles.hero} aria-label="Hero">
      {/* Background layers */}
      <div className={styles.bg}>
        <div className={styles.gradientLayer1} />
        <div className={styles.gradientLayer2} />
        <div className={styles.gridLines} />
      </div>

      {/* Floating shapes */}
      <div className={styles.shape1} />
      <div className={styles.shape2} />
      <div className={styles.shape3} />

      <div className={`container ${styles.content}`}>
        <div ref={textRef} className={styles.textBlock}>
          <div className={styles.eyebrow}>
            <Sparkles size={14} />
            <span>South Africa&apos;s Premium Home Solutions</span>
          </div>

          <h1 className={styles.headline}>
            Design Your
            <span className={styles.headlineAccent}> Perfect</span>
            <br />Living Space
          </h1>

          <p className={styles.subtext}>
            Premium furniture, bespoke curtains & blinds, and expert interior design — delivered across all 9 provinces. Your dream home starts here.
          </p>

          <div className={styles.ctaGroup}>
            <Link href="/shop" className="btn btn-primary btn-lg">
              Shop Collection <ArrowRight size={18} />
            </Link>
            <Link href="/design-studio" className="btn btn-outline btn-lg">
              Explore Design Studio
            </Link>
          </div>

          {/* <div className={styles.stats}>
            {[
              { value: '12,000+', label: 'Happy Clients' },
              { value: '9', label: 'Provinces Served' },
              { value: '4.9★', label: 'Average Rating' },
              { value: '15yr', label: 'Experience' },
            ].map((s) => (
              <div key={s.label} className={styles.stat}>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div> */}
        </div>

        {/* Hero visual card */}
        <div className={styles.visualCard}>
          <div className={styles.visualInner}>
            <div className={styles.roomPreview}>
              <div className={styles.roomFloor} />
              <div className={styles.roomSofa}>
                <div className={styles.sofaBody} />
                <div className={styles.sofaBack} />
                <div className={styles.sofaCushion} />
                <div className={styles.sofaCushion} />
              </div>
              <div className={styles.roomCurtain} />
              <div className={styles.roomCurtain} style={{ right: '10%', left: 'auto' }} />
              <div className={styles.roomTable} />
              <div className={styles.roomLamp} />
            </div>
            <div className={styles.visualBadge}>
              <span>✨ Visualize in Your Room</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className={styles.scrollHint}>
        <div className={styles.scrollLine} />
        <span>Scroll to explore</span>
      </div>
    </section>
  );
}
