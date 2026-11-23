import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import CategoryProductGrid from '@/components/shop/CategoryProductGrid';
import type { Product } from '@/lib/data';
import styles from './CurtainProductsSection.module.css';

interface CurtainProductsSectionProps {
  products: Product[];
}

/**
 * Live curtain catalogue on the Curtains & Blinds landing page. The landing
 * page previously only described the service, so active curtain products were
 * invisible unless visitors found /shop/curtains.
 */
export default function CurtainProductsSection({ products }: CurtainProductsSectionProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className={`section ${styles.section}`} aria-labelledby="curtain-products-title">
      <div className="container">
        <div className={styles.head}>
          <div>
            <span className="label-accent">Shop the Collection</span>
            <h2 id="curtain-products-title" className={styles.title}>
              Curtains &amp; <span className="heading-accent">Blinds</span>
            </h2>
            <p className={styles.lede}>
              Ready-made and made-to-measure window dressings from our current range.
            </p>
          </div>
          <Link href="/shop/curtains" className="btn btn-outline">
            View all curtains <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <CategoryProductGrid
          products={products}
          emptyMessage="No curtains or blinds products yet — check back soon."
        />
      </div>
    </section>
  );
}
