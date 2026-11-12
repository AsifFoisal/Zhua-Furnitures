'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Minus, Plus, ShoppingBag, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, type Product } from '@/lib/data';
import { FRAGRANCE_NOTES, getFragranceKind } from '@/lib/fragrance';
import { useCartStore } from '@/store';
import styles from './ScentBundleBuilder.module.css';

interface ScentBundleBuilderProps {
  products: Product[];
}

function thumbnailUrl(url: string, width = 360): string {
  if (!url.includes('/image/upload/')) {
    return url;
  }

  return url.replace('/image/upload/', `/image/upload/w_${width},c_fill,q_auto,f_auto/`);
}

function shortName(name: string): string {
  return name
    .replace(/^ZHUA\s+/i, '')
    .replace(/\s+Fragrance Oil.*$/i, '')
    .replace(/\s+—.*$/, '')
    .trim();
}

export default function ScentBundleBuilder({ products }: ScentBundleBuilderProps) {
  const machine = products.find((product) => getFragranceKind(product) === 'machine');
  const oils = products.filter((product) => getFragranceKind(product) === 'oil');
  const reed = products.find((product) => getFragranceKind(product) === 'reed');
  const { addItem } = useCartStore();

  const [selectedOilSlugs, setSelectedOilSlugs] = useState<string[]>(() => {
    const preferred = ['zhua-amber-noir-fragrance-oil-500ml', 'zhua-white-tea-fig-fragrance-oil-500ml'];
    const preselected = oils.filter((oil) => preferred.includes(oil.slug)).slice(0, 2);
    return (preselected.length > 0 ? preselected : oils.slice(0, 2)).map((oil) => oil.slug);
  });
  const [includeReed, setIncludeReed] = useState(false);

  const selectedOils = useMemo(
    () => oils.filter((oil) => selectedOilSlugs.includes(oil.slug)),
    [oils, selectedOilSlugs]
  );

  const selectedProducts = useMemo(
    () => [machine, ...selectedOils, includeReed ? reed : null].filter(Boolean) as Product[],
    [includeReed, machine, reed, selectedOils]
  );

  const total = selectedProducts.reduce((sum, product) => sum + product.price, 0);

  if (!machine || oils.length === 0) {
    return null;
  }

  const toggleOil = (slug: string) => {
    setSelectedOilSlugs((current) =>
      current.includes(slug) ? current.filter((entry) => entry !== slug) : [...current, slug]
    );
  };

  const addSetToCart = () => {
    if (selectedOils.length === 0) {
      toast.error('Choose at least one fragrance oil to complete your scent set.');
      return;
    }

    selectedProducts.forEach((product) => {
      addItem({
        product,
        quantity: 1,
        selectedColor: product.colors[0]?.name ?? 'Default',
      });
    });

    toast.success('Your ScentaRiva set has been added to the cart.');
  };

  return (
    <div className={styles.builder}>
      <div className={styles.builderMain}>
        <div className={styles.step}>
          <div className={styles.stepHead}>
            <span className={styles.stepNumber}>01</span>
            <div>
              <h3 className={styles.stepTitle}>Start with the machine</h3>
              <p className={styles.stepCopy}>The ScentaRiva diffuser is included in every set.</p>
            </div>
          </div>

          <div className={styles.machineCard}>
            <div className={styles.machineImage}>
              {machine.images[0] ? (
                <img src={thumbnailUrl(machine.images[0], 520)} alt={machine.name} />
              ) : null}
            </div>
            <div className={styles.machineInfo}>
              <p className={styles.eyebrow}>ScentaRiva</p>
              <h4>Smart Commercial Scent Diffuser</h4>
              <p>Automatic fragrance, digital controls and a refillable format for homes and businesses.</p>
              <span className={styles.machinePrice}>{formatPrice(machine.price)}</span>
            </div>
            <span className={styles.included}>
              <Check size={13} aria-hidden="true" /> Included
            </span>
          </div>
        </div>

        <div className={styles.step}>
          <div className={styles.stepHead}>
            <span className={styles.stepNumber}>02</span>
            <div>
              <h3 className={styles.stepTitle}>Choose your refills</h3>
              <p className={styles.stepCopy}>
                Select one or more 500ml signature oils. Two are pre-selected to get you started.
              </p>
            </div>
          </div>

          <div className={styles.oilGrid} role="group" aria-label="Choose fragrance oils">
            {oils.map((oil) => {
              const selected = selectedOilSlugs.includes(oil.slug);

              return (
                <button
                  key={oil.id}
                  type="button"
                  className={`${styles.oilOption} ${selected ? styles.oilOptionSelected : ''}`}
                  onClick={() => toggleOil(oil.slug)}
                  aria-pressed={selected}
                >
                  <span className={styles.oilImage}>
                    {oil.images[0] ? (
                      <img src={thumbnailUrl(oil.images[0], 300)} alt="" loading="lazy" />
                    ) : null}
                  </span>
                  <span className={styles.oilDetails}>
                    <span className={styles.oilName}>{shortName(oil.name)}</span>
                    <span className={styles.oilNotes}>{FRAGRANCE_NOTES[oil.slug] ?? 'Signature scent'}</span>
                    <span className={styles.oilPrice}>{formatPrice(oil.price)}</span>
                  </span>
                  <span className={styles.oilChoice} aria-hidden="true">
                    {selected ? <Check size={14} /> : <Plus size={14} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {reed ? (
          <div className={styles.step}>
            <div className={styles.stepHead}>
              <span className={styles.stepNumber}>03</span>
              <div>
                <h3 className={styles.stepTitle}>Finish the story</h3>
                <p className={styles.stepCopy}>Add a low-maintenance Absolut Gold reed diffuser.</p>
              </div>
            </div>

            <button
              type="button"
              className={`${styles.reedOption} ${includeReed ? styles.reedOptionSelected : ''}`}
              onClick={() => setIncludeReed((current) => !current)}
              aria-pressed={includeReed}
            >
              <span className={styles.reedImage}>
                {reed.images[0] ? (
                  <img src={thumbnailUrl(reed.images[0], 260)} alt="" loading="lazy" />
                ) : null}
              </span>
              <span className={styles.reedCopy}>
                <span className={styles.oilName}>Absolut Gold 150ml Reed Diffuser</span>
                <span className={styles.oilNotes}>
                  A flameless finishing touch for hallways, bathrooms and bedside tables.
                </span>
              </span>
              <span className={styles.reedPrice}>{includeReed ? 'Added' : formatPrice(reed.price)}</span>
              <span className={styles.oilChoice} aria-hidden="true">
                {includeReed ? <Minus size={14} /> : <Plus size={14} />}
              </span>
            </button>
          </div>
        ) : null}
      </div>

      <aside className={styles.summary} aria-label="Your custom scent set">
        <span className={styles.summaryLabel}>
          <Sparkles size={13} aria-hidden="true" /> Your scent set
        </span>
        <h3 className={styles.summaryTitle}>Built around your space.</h3>

        <ul className={styles.summaryList}>
          <li>
            <span>ScentaRiva machine</span>
            <span>{formatPrice(machine.price)}</span>
          </li>
          {selectedOils.map((oil) => (
            <li key={oil.id}>
              <span>{shortName(oil.name)} oil</span>
              <span>{formatPrice(oil.price)}</span>
            </li>
          ))}
          {includeReed && reed ? (
            <li>
              <span>Absolut Gold diffuser</span>
              <span>{formatPrice(reed.price)}</span>
            </li>
          ) : null}
        </ul>

        {selectedOils.length === 0 ? (
          <p className={styles.summaryHint}>Choose at least one fragrance oil to complete your set.</p>
        ) : null}

        <div className={styles.totalRow}>
          <span>Set total</span>
          <strong>{formatPrice(total)}</strong>
        </div>
        <p className={styles.summaryNote}>Delivery calculated at checkout.</p>

        <button
          type="button"
          className={styles.addSet}
          onClick={addSetToCart}
          disabled={selectedOils.length === 0}
        >
          <ShoppingBag size={16} aria-hidden="true" /> Add set to cart
        </button>

        <p className={styles.bundleNote}>
          Prefer our best value? The ready-made bundles below pair the machine with two oils and save
          up to R298.
        </p>

        <Link href={`/product/${machine.slug}`} className={styles.machineLink}>
          View machine details
        </Link>
      </aside>
    </div>
  );
}
