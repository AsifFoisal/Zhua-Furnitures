'use client';

import Link from 'next/link';
import { ArrowRight, Plus, ShoppingBag, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, type Product } from '@/lib/data';
import {
  FRAGRANCE_NOTES,
  getFragranceKind,
  isFragranceProduct,
  type FragranceKind,
} from '@/lib/fragrance';
import { useCartStore } from '@/store';
import styles from './FragranceCrossSell.module.css';

interface FragranceCrossSellProps {
  currentProduct: Product;
  products: Product[];
}

const priorityByKind: Record<FragranceKind, FragranceKind[]> = {
  machine: ['bundle', 'oil', 'reed'],
  oil: ['machine', 'oil', 'bundle', 'reed'],
  bundle: ['oil', 'reed', 'machine'],
  reed: ['machine', 'oil', 'bundle'],
};

const quotaByKind: Record<FragranceKind, Partial<Record<FragranceKind, number>>> = {
  machine: { bundle: 1, oil: 2, reed: 1 },
  oil: { machine: 1, oil: 1, bundle: 1, reed: 1 },
  bundle: { oil: 2, reed: 1, machine: 1 },
  reed: { machine: 1, oil: 2, bundle: 1 },
};

function thumbnailUrl(url: string, width = 560): string {
  if (!url.includes('/image/upload/')) {
    return url;
  }

  return url.replace('/image/upload/', `/image/upload/w_${width},c_fill,q_auto,f_auto/`);
}

function shortName(name: string): string {
  return name
    .replace(/^ZHUA\s+/i, '')
    .replace(/\s+—\s+Machine.*$/i, '')
    .replace(/\s+—.*$/, '')
    .trim();
}

function candidatePriority(product: Product, currentKind: FragranceKind): number {
  const kind = getFragranceKind(product);
  if (!kind) return 99;
  return priorityByKind[currentKind].indexOf(kind);
}

export default function FragranceCrossSell({ currentProduct, products }: FragranceCrossSellProps) {
  const { addItem } = useCartStore();
  const currentKind = getFragranceKind(currentProduct);

  if (!currentKind) {
    return null;
  }

  const allCandidates = products
    .filter((product) => isFragranceProduct(product) && product.id !== currentProduct.id)
    .sort((a, b) => {
      const priority = candidatePriority(a, currentKind) - candidatePriority(b, currentKind);
      if (priority !== 0) {
        return priority;
      }

      return a.price - b.price;
    });

  const quotas = quotaByKind[currentKind];
  const picked: Product[] = [];

  (Object.entries(quotas) as Array<[FragranceKind, number]>).forEach(([kind, limit]) => {
    allCandidates
      .filter((product) => getFragranceKind(product) === kind)
      .slice(0, limit)
      .forEach((product) => picked.push(product));
  });

  allCandidates.forEach((product) => {
    if (picked.length < 4 && !picked.some((entry) => entry.id === product.id)) {
      picked.push(product);
    }
  });

  const candidates = picked.slice(0, 4);

  if (candidates.length === 0) {
    return null;
  }

  const addProduct = (product: Product) => {
    if (!product.inStock) {
      toast.error(`${product.name} is currently out of stock.`);
      return;
    }

    addItem({
      product,
      quantity: 1,
      selectedColor: product.colors[0]?.name ?? 'Default',
    });
    toast.success(`${product.name} added to cart.`);
  };

  return (
    <section className={styles.section} aria-labelledby="fragrance-pairings-title">
      <div className={styles.head}>
        <div>
          <span className="label-accent">The scent wardrobe</span>
          <h2 id="fragrance-pairings-title" className={styles.title}>
            Complete the scent story.
          </h2>
        </div>
        <div className={styles.headAside}>
          <p>
            {currentKind === 'machine'
              ? 'Every ScentaRiva machine is refillable with our 500ml signature oils. Build a set or add a reed diffuser for quieter corners.'
              : 'Pair this piece with the rest of the ZHUA ScentaRiva collection for a consistent fragrance experience throughout your space.'}
          </p>
          <Link href="/fragrance" className={styles.viewAll}>
            View the collection <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className={styles.grid}>
        {candidates.map((product) => {
          const kind = getFragranceKind(product);
          const note =
            (kind === 'oil' ? FRAGRANCE_NOTES[product.slug] : null) ??
            (kind === 'machine' ? 'Smart commercial scent diffuser' : null) ??
            (kind === 'reed' ? 'Flameless finishing touch' : null) ??
            'ScentaRiva bundle';

          return (
            <article key={product.id} className={styles.card}>
              <Link href={`/product/${product.slug}`} className={styles.mediaLink}>
                {product.images[0] ? (
                  <img
                    src={thumbnailUrl(product.images[0])}
                    alt={product.name}
                    loading="lazy"
                    className={styles.image}
                  />
                ) : (
                  <div className="skeleton" style={{ width: '100%', height: '100%' }} aria-hidden="true" />
                )}
              </Link>
              <div className={styles.body}>
                <p className={styles.kicker}>{note}</p>
                <h3 className={styles.name}>
                  <Link href={`/product/${product.slug}`}>{shortName(product.name)}</Link>
                </h3>
                <div className={styles.footer}>
                  <span className={styles.price}>{formatPrice(product.price)}</span>
                  <button
                    type="button"
                    className={styles.addButton}
                    onClick={() => addProduct(product)}
                    disabled={!product.inStock}
                    aria-label={`Add ${product.name} to cart`}
                  >
                    {product.inStock ? <Plus size={13} /> : <X size={13} />}
                    {product.inStock ? 'Add' : 'Out'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.bundleBanner}>
        <div>
          <span className={styles.bundleKicker}>Prefer to choose your own?</span>
          <p>
            Build a custom ScentaRiva set around your space, then add the machine and your chosen
            refills to the cart in one step.
          </p>
        </div>
        <Link href="/fragrance#bundle-builder" className={styles.bundleCta}>
          <ShoppingBag size={15} /> Build your scent set <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
