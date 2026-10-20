import Link from 'next/link';
import { Home, DraftingCompass, Building2, ArrowRight } from 'lucide-react';
import styles from './AudienceSection.module.css';

const audiences = [
  {
    icon: Home,
    title: 'For Homeowners',
    copy: 'Transform one room or your entire home with ZHUA.',
    cta: 'Explore Home Solutions',
    href: '/shop',
  },
  {
    icon: DraftingCompass,
    title: 'For Interior Designers',
    copy: 'Source custom furniture, curtains, blinds, wall finishes and outdoor solutions for your projects.',
    cta: 'Work With ZHUA',
    href: '/contact',
  },
  {
    icon: Building2,
    title: 'For Businesses',
    copy: 'Hospitality, offices, restaurants, retail and commercial spaces.',
    cta: 'Discuss a Project',
    href: '/contact',
  },
];

export default function AudienceSection() {
  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className={`section-header ${styles.header}`}>
          <span className="label-accent">Who We Work With</span>
          <h2 className="heading-xl">Spaces Made for Every Project</h2>
        </div>

        <div className={styles.grid}>
          {audiences.map((audience) => {
            const Icon = audience.icon;
            return (
              <div key={audience.title} className={styles.card}>
                <div className={styles.iconWrap}>
                  <Icon size={26} />
                </div>
                <h3 className={styles.cardTitle}>{audience.title}</h3>
                <p className={styles.cardCopy}>{audience.copy}</p>
                <Link href={audience.href} className={styles.cardCta}>
                  {audience.cta} <ArrowRight size={15} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
