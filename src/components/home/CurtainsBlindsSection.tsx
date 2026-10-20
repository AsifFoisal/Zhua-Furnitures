import Link from 'next/link';
import { ArrowRight, Ruler, MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { isCurtainCustomizerEnabled } from '@/lib/features';
import { homeImagery } from '@/lib/home-imagery';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import styles from './CurtainsBlindsSection.module.css';

const curtains = ['Wave', 'Pinch Pleat', 'Eyelet', 'Sheer', 'Blockout', 'Double-layer'];
const blinds = ['Roller', 'Zebra', 'Venetian', 'Roman', 'Vertical', 'Motorised'];

export default function CurtainsBlindsSection() {
  const customizerEnabled = isCurtainCustomizerEnabled();

  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.intro}>
            <span className="label-accent">Curtains &amp; Blinds</span>
            <h2 className="heading-xl">Dress Your Windows</h2>
            <p className={styles.lede}>
              Made-to-measure curtains and blinds, professionally measured, manufactured and
              installed. You don&apos;t have to know exactly what you need — ZHUA guides you
              through the whole process.
            </p>
            <div className={styles.actions}>
              {customizerEnabled ? (
                <Link href="/design-studio/curtain-customizer" className="btn btn-primary">
                  Design My Curtains <ArrowRight size={16} />
                </Link>
              ) : (
                <Link href="/design-studio" className="btn btn-primary">
                  Design My Curtains <ArrowRight size={16} />
                </Link>
              )}
              <Link href="/shop/curtains" className="btn btn-outline">
                Explore Blinds
              </Link>
              <Link href="/book-installation" className="btn btn-ghost">
                <Ruler size={16} /> Book a Measure &amp; Quote
              </Link>
            </div>
          </div>

          <div className={styles.visual}>
            <ImagePlaceholder slot={homeImagery.curtainsVisual} />
          </div>
        </div>

        <div className={styles.optionGroups}>
          <div className={styles.group}>
            <h3 className={styles.groupTitle}>Curtains</h3>
            <ul className={styles.chips}>
              {curtains.map((label) => (
                <li key={label}>
                  <Link href="/shop/curtains" className={styles.chip}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.group}>
            <h3 className={styles.groupTitle}>Blinds</h3>
            <ul className={styles.chips}>
              {blinds.map((label) => (
                <li key={label}>
                  <Link href="/shop/curtains" className={styles.chip}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.serviceBand}>
          <div>
            <h3 className={styles.serviceTitle}>Need help choosing?</h3>
            <p className={styles.serviceText}>We&apos;ll measure, advise, make and install.</p>
          </div>
          <div className={styles.serviceActions}>
            <Link href="/book-installation" className="btn btn-primary">
              Book a Measure &amp; Quote
            </Link>
            <a
              href={buildWhatsAppUrl("Hi ZHUA! I'd like advice on curtains or blinds for my space.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
            >
              <MessageCircle size={16} /> Ask on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
