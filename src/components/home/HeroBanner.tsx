'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useStorefrontProducts } from '@/lib/use-storefront-products';
import { products as fallbackProducts, type Product } from '@/lib/data';
import { DESIGN_STUDIO_FEATURE } from '@/lib/features';
import styles from './HeroBanner.module.css';

export default function HeroBanner() {
  const textRef = useRef<HTMLDivElement>(null);
  const { products } = useStorefrontProducts();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 520], [0, -32]);
  const parallaxScale = useTransform(scrollY, [0, 520], [1, 1.06]);
  const visualMotionStyle = prefersReducedMotion ? undefined : { y: parallaxY, scale: parallaxScale };

  const carouselProducts = useMemo((): Product[] => {
    const source = products.length > 0 ? products : fallbackProducts;
    const newest = source.filter((item) => item.badge === 'new');
    const selected = newest.length > 0 ? newest : source;
    return selected.slice(0, 6);
  }, [products]);

  const carouselCount = carouselProducts.length;
  const safeIndex = carouselCount > 0 ? ((carouselIndex % carouselCount) + carouselCount) % carouselCount : 0;
  const isDesignStudioDisabled = !DESIGN_STUDIO_FEATURE.enabled;

  useEffect(() => {
    if (carouselPaused || carouselCount <= 1) {
      return;
    }

    const id = window.setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselCount);
    }, 4500);

    return () => window.clearInterval(id);
  }, [carouselPaused, carouselCount]);

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
            {isDesignStudioDisabled ? (
              <button className={`${styles.ctaDisabled} btn btn-outline btn-lg`} type="button" disabled>
                Design Studio <span>{DESIGN_STUDIO_FEATURE.label}</span>
              </button>
            ) : (
              <Link href="/design-studio" className="btn btn-outline btn-lg">
                Explore Design Studio
              </Link>
            )}
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
          <motion.div className={styles.visualMotion} style={visualMotionStyle}>
            <div className={styles.visualInner}>
            <div
              className={styles.carousel}
              onMouseEnter={() => setCarouselPaused(true)}
              onMouseLeave={() => setCarouselPaused(false)}
              onFocusCapture={() => setCarouselPaused(true)}
              onBlurCapture={() => setCarouselPaused(false)}
            >
              <div className={styles.carouselHeader}>
                <span className={styles.carouselEyebrow}>Latest Arrivals</span>
                <span className={styles.carouselCount}>{carouselCount} pieces</span>
              </div>
              <div className={styles.carouselViewport}>
                {carouselCount > 0 ? (
                  <div className={styles.carouselTrack} style={{ transform: `translateX(-${safeIndex * 100}%)` }}>
                    {carouselProducts.map((item, index) => (
                      <Link
                        key={item.id}
                        href={`/product/${item.slug}`}
                        className={styles.carouselSlide}
                        aria-label={`View ${item.name}`}
                      >
                        <div
                          className={styles.carouselImageWrap}
                          style={{ background: `${item.colors[0]?.hex ?? '#B59241'}22` }}
                        >
                          {item.images[0] ? (
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              className={styles.carouselImage}
                              loading={index === 0 ? 'eager' : 'lazy'}
                            />
                          ) : (
                            <div className={styles.carouselFallback}>{item.name.charAt(0)}</div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className={styles.carouselEmpty}>
                    New arrivals are styling up the studio. Check back soon.
                  </div>
                )}
              </div>
              <div className={styles.carouselControls}>
                <div className={styles.carouselButtons}>
                  <button
                    type="button"
                    className={styles.carouselBtn}
                    onClick={() =>
                      setCarouselIndex((prev) => (carouselCount > 0 ? (prev - 1 + carouselCount) % carouselCount : 0))
                    }
                    aria-label="Previous product"
                    disabled={carouselCount <= 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    className={styles.carouselBtn}
                    onClick={() =>
                      setCarouselIndex((prev) => (carouselCount > 0 ? (prev + 1) % carouselCount : 0))
                    }
                    aria-label="Next product"
                    disabled={carouselCount <= 1}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className={styles.carouselDots}>
                  {carouselProducts.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`${styles.carouselDot} ${index === safeIndex ? styles.carouselDotActive : ''}`}
                      onClick={() => setCarouselIndex(index)}
                      aria-label={`Go to ${item.name}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          </motion.div>
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
