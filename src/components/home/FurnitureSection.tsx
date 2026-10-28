import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { tileSlot, homeImagery } from '@/lib/home-imagery';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import styles from './FurnitureSection.module.css';

const featured = {
  title: 'Sofas & Lounges',
  description: 'Statement pieces made around how you actually live.',
  href: '/furniture#collection',
  visual: homeImagery.furnitureFeatured,
};

const tiles = [
  {
    title: 'Modular Sofas',
    visual: tileSlot(
      'Modern sofa with cushions in a styled lounge',
      'living',
      'Modular sofas',
      '/images/zhua/tile-sofa-orange.jpg',
    ),
  },
  {
    title: 'Beds & Headboards',
    visual: tileSlot(
      'Minimal bedroom with an upholstered bed and layered bedding',
      'bedroom',
      'Beds & headboards',
      '/images/zhua/tile-bedroom-minimal.jpg',
    ),
  },
  {
    title: 'Dining',
    visual: tileSlot(
      'Dining room with a timber table and green upholstered chairs',
      'dining',
      'Dining',
      '/images/zhua/tile-dining-green.jpg',
    ),
  },
  {
    title: 'TV Units',
    visual: tileSlot(
      'Built-in TV wall with floating shelves and framed art',
      'cabinetry',
      'TV units',
      '/images/zhua/wallz-tv-unit-wall.jpg',
    ),
  },
  {
    title: 'Cabinets & Storage',
    visual: tileSlot(
      'Cabinetry and storage unit in a styled room',
      'cabinetry',
      'Cabinets & storage',
      '/images/zhua/tile-cabinets-storage.jpg',
    ),
  },
];

const moreLinks = ['Outdoor Furniture', 'Reupholstery'];

export default function FurnitureSection() {
  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className={styles.header}>
          <div className="section-header">
            <span className="label-accent">Furniture</span>
            <h2 className="heading-xl">Furniture Made <span className="heading-accent">Around You</span></h2>
          </div>
          <p className={styles.lede}>
            From statement modular sofas to dining furniture, beds, TV units and custom cabinetry,
            we create furniture around your space, style and needs.
          </p>
          <div className={styles.actions}>
            <Link href="/contact" className="btn btn-outline">
              Custom Furniture
            </Link>
          </div>
        </div>

        <div className={styles.grid}>
          <Link href={featured.href} className={styles.featured}>
            <div className={styles.featuredVisual}>
              <ImagePlaceholder slot={featured.visual} showCaption={false} />
              <div className={styles.visualScrim} />
              <div className={styles.featuredCaption}>
                <h3>{featured.title}</h3>
                <p>{featured.description}</p>
                <span className={styles.cta}>
                  View the collection <ArrowRight size={15} />
                </span>
              </div>
            </div>
          </Link>

          {tiles.map((tile) => (
            <Link key={tile.title} href="/furniture#collection" className={styles.tile}>
              <div className={styles.tileVisual}>
                <ImagePlaceholder slot={tile.visual} showCaption={false} />
                <div className={styles.visualScrim} />
                <span className={styles.tileTitle}>{tile.title}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className={styles.more}>
          <span className={styles.moreLabel}>Also made by ZHUA</span>
          {moreLinks.map((label) => (
            <Link key={label} href="/furniture#collection" className={styles.moreLink}>
              {label} <ArrowRight size={13} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
