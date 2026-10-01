import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import type { ImagerySlot } from '@/lib/home-imagery';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import styles from './DivisionLanding.module.css';

export interface DivisionCta {
  label: string;
  href: string;
  variant?: 'primary' | 'outline' | 'whatsapp';
  external?: boolean;
}

interface DivisionLandingProps {
  eyebrow: string;
  title: string;
  description: string;
  visual: ImagerySlot;
  highlights: { title: string; description: string }[];
  ctas: DivisionCta[];
  /** Optional wording note, e.g. WALLZ keeps offerings deliberately flexible. */
  note?: string;
  /** Optional extra section (e.g. DB-driven showcase) rendered between highlights and the quote band. */
  children?: ReactNode;
}

function CtaLink({ cta }: { cta: DivisionCta }) {
  const variant = cta.variant ?? 'primary';
  const className =
    variant === 'whatsapp' ? 'btn btn-whatsapp' : `btn btn-${variant === 'primary' ? 'primary' : 'outline'}`;
  const inner = (
    <>
      {variant === 'whatsapp' ? <MessageCircle size={16} /> : null}
      {cta.label}
      {variant !== 'whatsapp' ? <ArrowRight size={16} /> : null}
    </>
  );

  if (cta.external) {
    return (
      <a href={cta.href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={cta.href} className={className}>
      {inner}
    </Link>
  );
}

export default function DivisionLanding({
  eyebrow,
  title,
  description,
  visual,
  highlights,
  ctas,
  note,
  children,
}: DivisionLandingProps) {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <span className="label-accent">{eyebrow}</span>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.description}>{description}</p>
            {note ? <p className={styles.note}>{note}</p> : null}
            <div className={styles.ctaGroup}>
              {ctas.map((cta) => (
                <CtaLink key={cta.label} cta={cta} />
              ))}
            </div>
          </div>
          <div className={styles.heroVisual}>
            <ImagePlaceholder slot={visual} loading="eager" />
          </div>
        </div>
      </section>

      <section className={`section ${styles.highlightsSection}`}>
        <div className="container">
          <h2 className={styles.highlightsTitle}>What we do</h2>
          <div className={styles.highlightsGrid}>
            {highlights.map((item) => (
              <div key={item.title} className={styles.highlightCard}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {children}

      <section className={`section-sm ${styles.quoteBand}`}>
        <div className={`container ${styles.quoteInner}`}>
          <div>
            <h2 className={styles.quoteTitle}>Ready to start?</h2>
            <p className={styles.quoteText}>
              Tell us about your space and we&apos;ll advise, quote and handle the rest.
            </p>
          </div>
          <div className={styles.quoteActions}>
            <Link href="/contact" className="btn btn-primary">
              Get a Quote <ArrowRight size={16} />
            </Link>
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
            >
              <MessageCircle size={16} /> WhatsApp ZHUA
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
