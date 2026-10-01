import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { homeImagery, type ImagerySlot } from '@/lib/home-imagery';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import styles from './OneSpaceOneZhua.module.css';

interface Division {
  number: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  visual: ImagerySlot;
}

const divisions: Division[] = [
  {
    number: '01',
    title: 'Furniture',
    description: 'Custom sofas · beds · dining · TV units · cabinetry · upholstery',
    cta: 'Explore Furniture',
    href: '/furniture',
    visual: homeImagery.divisionFurniture,
  },
  {
    number: '02',
    title: 'Curtains & Blinds',
    description: 'Wave · pinch pleat · sheers · blockout · roller · zebra · motorised',
    cta: 'Explore Curtains & Blinds',
    href: '/curtains-blinds',
    visual: homeImagery.divisionCurtains,
  },
  {
    number: '03',
    title: 'WALLZ',
    description: 'Feature walls · wall panelling · cladding · decorative finishes',
    cta: 'Explore WALLZ',
    href: '/wallz',
    visual: homeImagery.divisionWallz,
  },
  {
    number: '04',
    title: 'DECKZ',
    description: 'Outdoor decking · entertainment areas · patios · custom outdoor spaces',
    cta: 'Explore DECKZ',
    href: '/deckz',
    visual: homeImagery.divisionDeckz,
  },
];

export default function OneSpaceOneZhua() {
  return (
    <section id="spaces" className={`section ${styles.section}`}>
      <div className="container">
        <div className={`section-header ${styles.header}`}>
          <span className="label-accent">One Space. One ZHUA.</span>
          <h2 className="heading-xl">Complete spaces, made for you.</h2>
          <p className={styles.lede}>
            From the furniture you sit on to the walls around you, ZHUA helps you create a space
            that feels complete. Four divisions, one team, one standard of craft.
          </p>
        </div>

        <div className={styles.grid}>
          {divisions.map((division) => (
            <Link key={division.number} href={division.href} className={styles.card}>
              <div className={styles.visual}>
                <ImagePlaceholder slot={division.visual} showCaption={false} />
                <div className={styles.visualScrim} />
                <span className={styles.number}>{division.number}</span>
                <span className={styles.cardTitle}>{division.title}</span>
              </div>
              <div className={styles.body}>
                <p className={styles.description}>{division.description}</p>
                <span className={styles.cta}>
                  {division.cta} <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
