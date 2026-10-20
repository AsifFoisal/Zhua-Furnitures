'use client';

import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { homeImagery } from '@/lib/home-imagery';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import styles from './HeroSection.module.css';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const, delay },
  }),
};

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 600], [0, 90]);
  const backgroundScale = useTransform(scrollY, [0, 600], [1.02, 1.1]);
  const backgroundStyle = prefersReducedMotion ? undefined : { y: backgroundY, scale: backgroundScale };

  return (
    <section ref={sectionRef} className={styles.hero} aria-label="ZHUA — complete spaces">
      <motion.div className={styles.background} style={backgroundStyle} aria-hidden="true">
        <ImagePlaceholder slot={homeImagery.hero} showCaption={false} loading="eager" />
        <div className={styles.scrim} />
      </motion.div>

      <div className={`container ${styles.content}`}>
        <motion.p
          className={styles.eyebrow}
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          Furniture · Curtains &amp; Blinds · WALLZ · DECKZ
        </motion.p>

        <motion.h1
          className={styles.headline}
          custom={0.12}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          Transform Your Space.
          <span className={styles.headlineAccent}> Made for You.</span>
        </motion.h1>

        <motion.p
          className={styles.subtext}
          custom={0.26}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          Bespoke furniture, curtains &amp; blinds, wall finishes and decking — designed, made
          and installed to bring your entire space together.
        </motion.p>

        <motion.div
          className={styles.ctaGroup}
          custom={0.4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <Link href="#spaces" className="btn btn-primary btn-lg">
            Explore Our Services <ArrowRight size={18} />
          </Link>
          <Link href="/contact" className="btn btn-outline btn-lg">
            Get a Quote
          </Link>
          <a
            href={buildWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp btn-lg"
          >
            <MessageCircle size={18} /> WhatsApp ZHUA
          </a>
        </motion.div>
      </div>

      <div className={styles.scrollHint} aria-hidden="true">
        <div className={styles.scrollLine} />
        <span>Scroll to explore</span>
      </div>
    </section>
  );
}
