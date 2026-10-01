import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { homeImagery } from '@/lib/home-imagery';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import styles from './FinalCTA.module.css';

export default function FinalCTA() {
  return (
    <section className={`section ${styles.section}`}>
      <div className={styles.background}>
        <ImagePlaceholder slot={homeImagery.finalCta} showCaption={false} />
        <div className={styles.scrim} />
      </div>

      <div className={`container ${styles.content}`}>
        <span className="label-accent">Start Your Transformation</span>
        <h2 className={`heading-xl ${styles.title}`}>Ready to Transform Your Space?</h2>
        <p className={styles.lede}>
          Whether you need a new sofa, custom curtains, a feature wall or a complete interior
          solution, let&apos;s bring your vision to life.
        </p>

        <div className={styles.ctaGroup}>
          <Link href="/contact" className="btn btn-primary btn-lg">
            Get a Quote <ArrowRight size={18} />
          </Link>
          <a
            href={buildWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp btn-lg"
          >
            <MessageCircle size={18} /> WhatsApp ZHUA
          </a>
          <Link href="/contact" className="btn btn-ghost btn-lg">
            Visit Our Factory
          </Link>
        </div>
      </div>
    </section>
  );
}
