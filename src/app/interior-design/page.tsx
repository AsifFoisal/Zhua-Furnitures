import type { Metadata } from 'next';
import DivisionLanding from '@/components/pages/DivisionLanding';
import { homeImagery } from '@/lib/home-imagery';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Interior Design — Complete Rooms, One Team | ZHUA',
  description:
    'ZHUA Interior Design: space planning, furniture selection, custom furniture, curtains & blinds, colour and fabric consultation, upholstery and full-room design packages — with WALLZ & DECKZ coordinated as part of the complete project.',
};

const services = [
  {
    title: 'Space Planning',
    description: 'Layouts that make the room work — traffic flow, focal points and proportions sorted before anything is bought.',
  },
  {
    title: 'Furniture Selection',
    description: 'Pieces chosen to fit the space, the budget and how you actually live in it.',
  },
  {
    title: 'Custom Furniture',
    description: 'Made-to-measure pieces built in our own factory when off-the-shelf won\u2019t do.',
  },
  {
    title: 'Sofas & Lounge Furniture',
    description: 'Sofas, sectionals and lounge seating sized and styled around your room.',
  },
  {
    title: 'Dining Furniture',
    description: 'Dining tables, chairs and serving pieces that suit the space and the occasion.',
  },
  {
    title: 'Curtains & Blinds',
    description: 'Made-to-measure window treatments specified as part of the overall design, not an afterthought.',
  },
  {
    title: 'Colour & Fabric Consultation',
    description: 'Palettes, fabrics and finishes pulled together so every element in the room agrees.',
  },
  {
    title: 'Upholstery',
    description: 'Re-upholstery and custom upholstery work — refresh the pieces worth keeping.',
  },
  {
    title: 'Lighting & Decor Recommendations',
    description: 'Lighting plans and decor selections that finish the room once the big pieces are in.',
  },
  {
    title: 'Bedroom & Living-Room Concepts',
    description: 'Complete concept boards for the rooms you use most, from headboard wall to final cushion.',
  },
  {
    title: 'Full-Room Design Packages',
    description: 'One package, one team: design, manufacture, deliver and install the whole room.',
  },
];

export default function InteriorDesignPage() {
  return (
    <DivisionLanding
      eyebrow="Interior Design by ZHUA"
      title="The Whole Room, Designed as One"
      description="Interior design at ZHUA covers the complete look and feel of your space — layout, furniture, fabrics, window treatments, lighting and decor — planned together so everything works as one room."
      note="WALLZ feature walls and DECKZ outdoor spaces can be coordinated as part of your complete interior project — one team, one timeline, one standard of finish."
      visual={homeImagery.completeRoom}
      ctas={[
        { label: 'Book a Design Consultation', href: '/contact' },
        { label: 'Explore Our Furniture', href: '/furniture', variant: 'outline' },
      ]}
      highlights={services}
    >
      <section className={`section ${styles.packagesSection}`}>
        <div className="container">
          <div className={styles.packagesHead}>
            <span className="label-accent">How We Work</span>
            <h2>From First Consultation to Final Install</h2>
            <p>
              Whether it&apos;s a single room or the whole home, the process stays the same — and
              WALLZ &amp; DECKZ installations slot into the same timeline where the design calls
              for them.
            </p>
          </div>
          <div className={styles.packagesGrid}>
            <div className={styles.packageCard}>
              <span className={styles.packageStep}>01</span>
              <h3>Consultation &amp; Space Planning</h3>
              <p>
                We visit your space, measure properly and talk through how you use the room.
                You get a layout and a clear scope.
              </p>
            </div>
            <div className={styles.packageCard}>
              <span className={styles.packageStep}>02</span>
              <h3>Concept &amp; Selection</h3>
              <p>
                Furniture, fabrics, colours, curtains and lighting pulled together into a concept
                you can sign off on — with transparent pricing.
              </p>
            </div>
            <div className={styles.packageCard}>
              <span className={styles.packageStep}>03</span>
              <h3>Manufacture &amp; Coordinate</h3>
              <p>
                Custom pieces are built in our factory while curtains, upholstery and any WALLZ
                or DECKZ work are scheduled around the same timeline.
              </p>
            </div>
            <div className={styles.packageCard}>
              <span className={styles.packageStep}>04</span>
              <h3>Delivery &amp; Install</h3>
              <p>
                Our team delivers, installs and styles the room — so you walk into a finished
                space, not a project.
              </p>
            </div>
          </div>
        </div>
      </section>
    </DivisionLanding>
  );
}
