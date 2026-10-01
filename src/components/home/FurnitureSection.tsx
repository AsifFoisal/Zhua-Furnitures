import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { tileSlot, homeImagery } from '@/lib/home-imagery';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import styles from './FurnitureSection.module.css';

const featured = {
  title: 'Sofas & Lounges',
  description: 'Statement pieces made around how you actually live.',
  href: '/shop/furniture',
  visual: homeImagery.furnitureFeatured,
};

const tiles = [
  { title: 'Modular Sofas', visual: tileSlot('Modular ZHUA sofa configuration', 'living', 'Modular sofas') },
  { title: 'Beds & Headboards', visual: tileSlot('Custom ZHUA bed and headboard', 'bedroom', 'Beds & headboards') },
  { title: 'Dining', visual: tileSlot('ZHUA dining table and chairs', 'dining', 'Dining') },
  { title: 'TV Units', visual: tileSlot('Custom ZHUA TV unit', 'cabinetry', 'TV units') },
  { title: 'Cabinets & Storage', visual: tileSlot('Custom ZHUA cabinets and storage', 'cabinetry', 'Cabinets & storage') },
];

const moreLinks = ['Outdoor Furniture', 'Reupholstery'];

export default function FurnitureSection() {
  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className={styles.header}>
          <div className="section-header">
            <span className="label-accent">Furniture</span>
            <h2 className="heading-xl">Furniture Made Around You</h2>
          </div>
          <p className={styles.lede}>
            From statement modular sofas to dining furniture, beds, TV units and custom cabinetry,
            we create furniture around your space, style and needs.
          </p>
          <div className={styles.actions}>
            <Link href="/shop/furniture" className="btn btn-primary">
              Shop Furniture <ArrowRight size={16} />
            </Link>
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
                  Shop now <ArrowRight size={15} />
                </span>
              </div>
            </div>
          </Link>

          {tiles.map((tile) => (
            <Link key={tile.title} href="/shop/furniture" className={styles.tile}>
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
            <Link key={label} href="/shop/furniture" className={styles.moreLink}>
              {label} <ArrowRight size={13} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
