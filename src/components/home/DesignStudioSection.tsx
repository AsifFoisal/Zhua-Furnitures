import Link from 'next/link';
import { ArrowRight, LayoutTemplate, Calculator, PenTool, Wand2, Lock } from 'lucide-react';
import { DESIGN_STUDIO_FEATURE, isCurtainCustomizerEnabled } from '@/lib/features';
import styles from './DesignStudioSection.module.css';

interface ToolCard {
  icon: typeof Wand2;
  title: string;
  description: string;
  cta: string;
  href: string;
  disabled?: boolean;
}

const customizerEnabled = isCurtainCustomizerEnabled();

const cards: ToolCard[] = [
  {
    icon: Wand2,
    title: 'Room Visualizer',
    description: 'Upload your room and visualise your furniture.',
    cta: 'Try Room Visualizer',
    href: DESIGN_STUDIO_FEATURE.enabled ? '/design-studio/room-visualizer' : '/design-studio',
    disabled: !DESIGN_STUDIO_FEATURE.enabled,
  },
  {
    icon: LayoutTemplate,
    title: 'Curtain Customizer',
    description: 'Choose fabric, colour, style and finish.',
    cta: 'Customize Curtains',
    href: '/design-studio/curtain-customizer',
    disabled: !customizerEnabled,
  },
  {
    icon: Calculator,
    title: 'Curtain Calculator',
    description: 'Calculate curtain requirements from your measurements.',
    cta: 'Calculate Now',
    href: '/design-studio/curtain-customizer',
    disabled: !customizerEnabled,
  },
  {
    icon: PenTool,
    title: 'Request a Custom Design',
    description: "Tell us what you're imagining and we'll help develop it.",
    cta: 'Start Your Design',
    href: '/contact',
  },
];

export default function DesignStudioSection() {
  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className={`section-header ${styles.header}`}>
          <span className="label-accent">ZHUA Design Studio</span>
          <h2 className="heading-xl">Design Before You Buy</h2>
          <p className={styles.lede}>
            See it. Configure it. Measure it. Then make it yours. ZHUA combines design,
            technology, manufacturing and installation.
          </p>
        </div>

        <div className={styles.grid}>
          {cards.map((card) => {
            const Icon = card.icon;
            const content = (
              <>
                <div className={styles.iconWrap}>
                  <Icon size={24} />
                </div>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardDesc}>{card.description}</p>
                <span className={styles.cardCta}>
                  {card.cta}
                  {card.disabled ? <Lock size={13} /> : <ArrowRight size={15} />}
                </span>
              </>
            );

            return card.disabled ? (
              <div key={card.title} className={`${styles.card} ${styles.cardDisabled}`} aria-disabled="true">
                {content}
                <span className={styles.comingSoon}>{DESIGN_STUDIO_FEATURE.label}</span>
              </div>
            ) : (
              <Link key={card.title} href={card.href} className={styles.card}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
