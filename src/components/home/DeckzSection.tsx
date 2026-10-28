import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { homeImagery } from '@/lib/home-imagery';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import styles from './DivisionSplit.module.css';

const services = [
  'Wooden decking',
  'Composite decking',
  'Outdoor platforms',
  'Patio & deck areas',
  'Custom deck designs',
];

export default function DeckzSection() {
  return (
    <section className={`section ${styles.sectionAlt}`}>
      <div className={`container ${styles.grid} ${styles.gridReverse}`}>
        <div className={styles.contentCol}>
          <span className="label-accent">DECKZ by ZHUA</span>
          <h2 className="heading-xl">Take Your Living <span className="heading-accent">Outdoors</span></h2>
          <p className={styles.lede}>
            Custom decking and outdoor spaces designed for entertaining, relaxing and living —
            extending the ZHUA standard of craft beyond your walls.
          </p>

          <ul className={styles.serviceList}>
            {services.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>

          <div className={styles.actions}>
            <Link href="/deckz" className="btn btn-primary">
              Explore DECKZ <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className={styles.visualCol}>
          <div className={styles.giantWord} aria-hidden="true">
            DECKZ
          </div>
          <div className={styles.visual}>
            <ImagePlaceholder slot={homeImagery.deckzVisual} />
          </div>
        </div>
      </div>
    </section>
  );
}
