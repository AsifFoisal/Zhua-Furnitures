'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import styles from './CategoryCards.module.css';

const categories = [
  {
    id: 'furniture',
    label: 'Furniture',
    desc: 'Sofas, beds, tables & storage — crafted for longevity',
    href: '/shop/furniture',
    image: '/images/categories/furniture-luxury.svg',
    imageAlt: 'Premium furniture setting with sofa and warm interior tones',
    gradient: 'linear-gradient(135deg, #2A1F14 0%, #3D2E1C 100%)',
    accent: '#B59241',
  },
  {
    id: 'curtains',
    label: 'Curtains & Blinds',
    desc: 'Custom window dressings tailored to every room',
    href: '/shop/curtains',
    image: '/images/categories/curtains-bespoke.svg',
    imageAlt: 'Bespoke curtain styling around a modern window',
    gradient: 'linear-gradient(135deg, #14201A 0%, #1C2F25 100%)',
    accent: '#4ECDC4',
  },
  {
    id: 'accessories',
    label: 'Home Accessories',
    desc: 'Curated décor objects to complete your interior story',
    href: '/shop/accessories',
    image: '/images/categories/accessories-curated.svg',
    imageAlt: 'Curated home accessories arranged on styled shelves',
    gradient: 'linear-gradient(135deg, #1A1425 0%, #251C35 100%)',
    accent: '#B39DDB',
  },
];

export default function CategoryCards() {
  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className="section-header" style={{ textAlign: 'center' }}>
          <span className="label-accent">Collections</span>
          <div className="gold-divider" style={{ margin: '0.75rem auto 1rem' }} />
          <h2 className="heading-xl">Shop by Category</h2>
        </div>

        <div className={styles.grid}>
          {categories.map((cat) => (
            <Link key={cat.id} href={cat.href} className={styles.card} style={{ background: cat.gradient }}>
              <div className={styles.cardVisual}>
                <Image
                  src={cat.image}
                  alt={cat.imageAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={styles.cardVisualImage}
                />
              </div>
              <div className={styles.cardContent}>
                <span className={styles.cardCount} style={{ color: cat.accent }}>{cat.count}</span>
                <h3 className={styles.cardTitle}>{cat.label}</h3>
                <p className={styles.cardDesc}>{cat.desc}</p>
                <div className={styles.cardArrow} style={{ color: cat.accent }}>
                  Shop Now <ArrowRight size={16} />
                </div>
              </div>
              <div className={styles.cardBorder} style={{ borderColor: cat.accent + '30' }} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
