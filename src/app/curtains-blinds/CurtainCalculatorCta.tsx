import Link from 'next/link';
import { ArrowRight, Calculator, Check, MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import styles from './CurtainCalculatorCta.module.css';

/**
 * Prominent entry point to the curtain calculator, shown at the top of the
 * Curtains & Blinds landing page. The division pages hide the DivisionLanding
 * hero (and with it the hero CTAs), so the calculator gets its own highlighted
 * band instead of being buried in the bottom quote strip.
 */
export default function CurtainCalculatorCta() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.band}>
          <div className={styles.copy}>
            <span className="label-accent">Free Instant Estimate</span>
            <h2 className={styles.title}>
              Curtain <span className="heading-accent">Calculator</span>
            </h2>
            <p className={styles.lede}>
              Enter your window measurements, choose fabric and colour, and watch your estimate update
              live — before you commit to anything.
            </p>
            <ul className={styles.points}>
              <li>
                <Check size={14} aria-hidden="true" /> Instant per-window pricing
              </li>
              <li>
                <Check size={14} aria-hidden="true" /> Fabric &amp; colour preview
              </li>
              <li>
                <Check size={14} aria-hidden="true" /> No payment online
              </li>
            </ul>
          </div>

          <div className={styles.action}>
            <Link
              href="/design-studio/curtain-customizer"
              className={`btn btn-primary btn-lg ${styles.highlight}`}
            >
              <Calculator size={18} aria-hidden="true" />
              Curtain Calculator
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a
              href={buildWhatsAppUrl("Hi! I'd like help sizing curtains for my windows.")}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsapp}
            >
              <MessageCircle size={14} aria-hidden="true" /> Rather chat? WhatsApp us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
