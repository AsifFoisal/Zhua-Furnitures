import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { homeImagery } from '@/lib/home-imagery';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import styles from './DivisionSplit.module.css';

const services = [
  'TV feature walls',
  'Slat walls',
  'Decorative wall panels',
  'Wood-look cladding',
  'Accent walls',
  'Headboard walls',
  'Commercial wall installations',
];

export default function WallzSection() {
  return (
    <section className={`section ${styles.section}`}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.visualCol}>
          <div className={styles.giantWord} aria-hidden="true">
            WALLZ
          </div>
          <div className={styles.visual}>
            <ImagePlaceholder slot={homeImagery.wallzVisual} />
          </div>
        </div>

        <div className={styles.contentCol}>
          <span className="label-accent">WALLZ by ZHUA</span>
          <h2 className="heading-xl">Give Your Walls a New Identity</h2>
          <p className={styles.lede}>
            Feature walls, decorative panelling and wall finishes designed to transform ordinary
            spaces into statement spaces.
          </p>

          <ul className={styles.serviceList}>
            {services.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>

          <div className={styles.actions}>
            <Link href="/wallz" className="btn btn-primary">
              Explore WALLZ <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
