import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { FRAGRANCE_SLUGS } from '@/lib/fragrance';
import styles from './FragranceSection.module.css';

const notes = [
  'Automatic fragrance',
  'Digital controls',
  'Refillable oils',
  'Home & business',
];

export default function FragranceSection() {
  return (
    <section className={`section ${styles.section}`}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.visual}>
          <img
            src="/images/fragrance/scentariva-collection-trio.jpg"
            alt="ScentaRiva reed diffuser collection — ZHUA Signature, Vertical Pulse and Absolut Gold"
            loading="lazy"
            className={styles.image}
          />
          <span className={styles.visualTag}>Home &amp; business scent collection</span>
        </div>

        <div className={styles.content}>
          <span className="label-accent">ZHUA ScentaRiva</span>
          <h2 className={`heading-xl ${styles.title}`}>
            Make the last detail <span className="heading-accent">unforgettable.</span>
          </h2>
          <p className={styles.lede}>
            Turn every space into a beautiful fragrance experience. The ScentaRiva automatic scent
            diffuser, signature 500ml oils and Absolut Gold reed diffusers make homes, offices,
            hotels and shops feel consistently fresh and inviting.
          </p>

          <ul className={styles.notes}>
            {notes.map((note) => (
              <li key={note}>
                <Check size={13} aria-hidden="true" /> {note}
              </li>
            ))}
          </ul>

          <div className={styles.actions}>
            <Link href="/fragrance" className="btn btn-primary">
              Explore the collection <ArrowRight size={16} />
            </Link>
            <Link
              href={`/product/${FRAGRANCE_SLUGS.machine}`}
              className="btn btn-outline"
            >
              Shop the machine
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
