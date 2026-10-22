import Link from 'next/link';
import { ImageOff } from 'lucide-react';
import { formatPrice, type Product } from '@/lib/data';
import styles from './CategoryProductGrid.module.css';

interface CategoryProductGridProps {
  products: Product[];
  emptyMessage?: string;
}

/** Request a grid-sized Cloudinary derivative instead of the full-size original. */
function thumbnailUrl(url: string, width = 640): string {
  if (!url.includes('/image/upload/')) {
    return url;
  }

  return url.replace('/image/upload/', `/image/upload/w_${width},c_fill,q_auto,f_auto/`);
}

export default function CategoryProductGrid({ products, emptyMessage }: CategoryProductGridProps) {
  if (products.length === 0) {
    return <p className={styles.empty}>{emptyMessage ?? 'No products in this category yet.'}</p>;
  }

  return (
    <div className={styles.grid}>
      {products.map((product) => {
        const image = product.images[0];

        return (
          <Link key={product.id} href={`/product/${product.slug}`} className={styles.card}>
            <div className={styles.visual}>
              {image ? (
                <img
                  src={thumbnailUrl(image)}
                  alt={product.name}
                  loading="lazy"
                  className={styles.image}
                />
              ) : (
                <div className={styles.imageFallback} aria-hidden="true">
                  <ImageOff size={28} />
                </div>
              )}
            </div>
            <div className={styles.body}>
              <p className={styles.subcategory}>{product.subcategory}</p>
              <h2 className={styles.name}>{product.name}</h2>
              <p className={styles.price}>{formatPrice(product.price)}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
