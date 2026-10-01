'use client';

import { useState } from 'react';
import { homeImagery } from '@/lib/home-imagery';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import styles from './CompleteYourRoom.module.css';

const hotspots = [
  {
    number: '01',
    title: 'Sofa',
    solution: 'Custom ZHUA furniture',
    detail: 'Designed, manufactured and upholstered around your space.',
    position: { left: '42%', top: '64%' },
  },
  {
    number: '02',
    title: 'Windows',
    solution: 'Curtains & blinds',
    detail: 'Made-to-measure, professionally measured and installed.',
    position: { left: '16%', top: '26%' },
  },
  {
    number: '03',
    title: 'Walls',
    solution: 'WALLZ feature wall',
    detail: 'Panelling and finishes that turn walls into statements.',
    position: { left: '76%', top: '34%' },
  },
  {
    number: '04',
    title: 'Outdoor',
    solution: 'DECKZ entertainment space',
    detail: 'Decking that carries your living area beyond the walls.',
    position: { left: '84%', top: '78%' },
  },
];

export default function CompleteYourRoom() {
  const [active, setActive] = useState(0);

  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className={`section-header ${styles.header}`}>
          <span className="label-accent">Complete Your Room</span>
          <h2 className="heading-xl">Build the Room. Not Just the Product.</h2>
          <p className={styles.lede}>
            One project. Multiple solutions. One ZHUA team. Explore how the four divisions come
            together in a single space.
          </p>
        </div>

        <div className={styles.layout}>
          <div className={styles.visual}>
            <ImagePlaceholder slot={homeImagery.completeRoom} showCaption={false} />
            {hotspots.map((spot, index) => (
              <button
                key={spot.number}
                type="button"
                className={`${styles.hotspot} ${index === active ? styles.hotspotActive : ''}`}
                style={spot.position}
                onClick={() => setActive(index)}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                aria-pressed={index === active}
                aria-label={`${spot.number} — ${spot.title}: ${spot.solution}`}
              >
                <span className={styles.hotspotRing} aria-hidden="true" />
                {spot.number}
              </button>
            ))}
          </div>

          <div className={styles.panel} role="list">
            {hotspots.map((spot, index) => (
              <button
                key={spot.number}
                type="button"
                role="listitem"
                className={`${styles.panelItem} ${index === active ? styles.panelItemActive : ''}`}
                onClick={() => setActive(index)}
                onMouseEnter={() => setActive(index)}
              >
                <span className={styles.panelNumber}>{spot.number}</span>
                <span className={styles.panelBody}>
                  <span className={styles.panelTitle}>{spot.title}</span>
                  <span className={styles.panelSolution}>{spot.solution}</span>
                  {index === active ? <span className={styles.panelDetail}>{spot.detail}</span> : null}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
