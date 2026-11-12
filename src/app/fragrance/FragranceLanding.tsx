'use client';

import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  Briefcase,
  Check,
  Droplets,
  Hotel,
  House,
  MessageCircle,
  Quote,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  UtensilsCrossed,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, type Product } from '@/lib/data';
import {
  FRAGRANCE_NOTES,
  SCENT_PROCESS,
  SCENT_USE_CASES,
  getFragranceKind,
} from '@/lib/fragrance';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { useCartStore } from '@/store';
import ScentBundleBuilder from '@/components/fragrance/ScentBundleBuilder';
import styles from './FragranceLanding.module.css';

interface FragranceLandingProps {
  initialProducts: Product[];
}

const useCaseIcons: Record<(typeof SCENT_USE_CASES)[number]['icon'], LucideIcon> = {
  home: House,
  hotel: Hotel,
  briefcase: Briefcase,
  sparkles: Sparkles,
  store: Store,
  utensils: UtensilsCrossed,
};

function thumbnailUrl(url: string, width = 720): string {
  if (!url.includes('/image/upload/')) {
    return url;
  }

  return url.replace('/image/upload/', `/image/upload/w_${width},c_fill,q_auto,f_auto/`);
}

function shortOilName(name: string): string {
  return name
    .replace(/^ZHUA\s+/i, '')
    .replace(/\s+Fragrance Oil.*$/i, '')
    .replace(/\s+—.*$/, '')
    .trim();
}

function shortProductName(name: string): string {
  return name.replace(/^ZHUA\s+/i, '').replace(/\s+—.*$/, '').trim();
}

export default function FragranceLanding({ initialProducts }: FragranceLandingProps) {
  const { addItem } = useCartStore();

  const machine = initialProducts.find((product) => getFragranceKind(product) === 'machine');
  const oils = initialProducts.filter((product) => getFragranceKind(product) === 'oil');
  const bundles = initialProducts.filter((product) => getFragranceKind(product) === 'bundle');
  const reed = initialProducts.find((product) => getFragranceKind(product) === 'reed');

  const addProduct = (product: Product, successMessage?: string) => {
    if (!product.inStock) {
      toast.error(`${product.name} is currently out of stock.`);
      return;
    }

    addItem({
      product,
      quantity: 1,
      selectedColor: product.colors[0]?.name ?? 'Default',
    });
    toast.success(successMessage ?? `${product.name} added to cart.`);
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBackdrop} aria-hidden="true" />
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <div className={styles.kicker}>
              <span className={styles.kickerRule} aria-hidden="true" />
              <span className="label-accent">ZHUA ScentaRiva</span>
            </div>
            <h1 className={styles.heroTitle}>
              Turn every space into a <em>beautiful fragrance experience.</em>
            </h1>
            <p className={styles.heroText}>
              The ZHUA ScentaRiva Smart Commercial Scent Diffuser Machine disperses fragrance
              automatically — creating a consistently beautiful atmosphere in homes, offices,
              hotels and shops.
            </p>
            <div className={styles.heroActions}>
              {machine ? (
                <Link href={`/product/${machine.slug}`} className="btn btn-primary btn-lg">
                  Shop the machine <ArrowRight size={17} />
                </Link>
              ) : null}
              <a href="#bundle-builder" className="btn btn-ghost btn-lg">
                Build your scent set
              </a>
            </div>
            <ul className={styles.heroNotes}>
              <li>
                <Settings2 size={14} aria-hidden="true" /> Digital controls
              </li>
              <li>
                <Droplets size={14} aria-hidden="true" /> Refillable fragrance
              </li>
              <li>
                <Truck size={14} aria-hidden="true" /> Delivered across SA
              </li>
            </ul>
            {machine ? (
              <p className={styles.heroPrice}>
                Machine from <strong>{formatPrice(machine.price)}</strong>
                <span> · Oils from {formatPrice(oils[0]?.price ?? 399)}</span>
              </p>
            ) : null}
          </div>

          <a href="#collection" className={styles.scrollCue} aria-label="Explore the fragrance collection">
            <span>Explore the collection</span>
            <ArrowDown size={16} />
          </a>
        </div>
      </section>

      <section className={styles.intro}>
        <div className="container">
          <div className={styles.introGrid}>
            <div>
              <span className="label-accent">The fragrance collection</span>
              <h2 className={styles.introTitle}>
                One system. A complete <span className="heading-accent">scent wardrobe.</span>
              </h2>
            </div>
            <p className={styles.introText}>
              From the ScentaRiva machine to signature 500ml fragrance oils, ready-made bundles and
              Absolut Gold reed diffusers — everything you need to make a beautiful first
              impression, every day.
            </p>
          </div>
          <div className={styles.stats}>
            <div>
              <strong>{oils.length || 4}</strong>
              <span>Signature scent profiles</span>
            </div>
            <div>
              <strong>500ml</strong>
              <span>Refillable fragrance oils</span>
            </div>
            <div>
              <strong>Home + business</strong>
              <span>Designed for every space</span>
            </div>
            <div>
              <strong>SA delivery</strong>
              <span>All nine provinces</span>
            </div>
          </div>
        </div>
      </section>

      {machine ? (
        <section id="collection" className={styles.machineSection}>
          <div className={`container ${styles.machineGrid}`}>
            <div className={styles.machineMedia}>
              <div className={styles.machineImageFrame}>
                {machine.images[0] ? (
                  <img
                    src={thumbnailUrl(machine.images[0], 1200)}
                    alt={machine.name}
                    className={styles.machineImage}
                  />
                ) : (
                  <div className="skeleton" style={{ width: '100%', height: '100%' }} aria-hidden="true" />
                )}
              </div>
              <span className={styles.mediaTag}>01 — The centrepiece</span>
              <div className={styles.mediaBadge}>
                <Sparkles size={14} aria-hidden="true" />
                <span>Automatic diffusion</span>
              </div>
            </div>

            <div className={styles.machineCopy}>
              <span className="label-accent">The machine</span>
              <h2 className={styles.sectionTitle}>{shortProductName(machine.name)}</h2>
              <p className={styles.lead}>
                Designed to disperse fragrance automatically, this stylish machine creates a
                consistently pleasant atmosphere without spraying air freshener throughout the day.
              </p>
              <p className={styles.bodyText}>
                Its digital control panel lets you adjust the machine&apos;s operating settings to
                suit your space, while the sleek matte-black finish fits beautifully into modern
                homes, receptions, salons and retail environments.
              </p>

              <ul className={styles.benefitList}>
                <li>
                  <Check size={14} aria-hidden="true" /> Automatic fragrance distribution
                </li>
                <li>
                  <Check size={14} aria-hidden="true" /> Digital operating controls
                </li>
                <li>
                  <Check size={14} aria-hidden="true" /> Refillable with ZHUA ScentaRiva oils
                </li>
                <li>
                  <Check size={14} aria-hidden="true" /> Commercial-ready, modern design
                </li>
              </ul>

              <div className={styles.purchaseRow}>
                <div className={styles.priceBlock}>
                  <span className={styles.price}>{formatPrice(machine.price)}</span>
                  <span className={styles.priceNote}>Machine price</span>
                </div>
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => addProduct(machine, 'ScentaRiva machine added to cart.')}
                  disabled={!machine.inStock}
                >
                  <ShoppingBag size={16} aria-hidden="true" /> Add to cart
                </button>
                <Link href={`/product/${machine.slug}`} className={styles.detailsLink}>
                  Full details <ArrowRight size={14} />
                </Link>
              </div>

              <p className={styles.compatibility}>
                Compatible with every ZHUA ScentaRiva 500ml fragrance oil in the collection.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {oils.length > 0 ? (
        <section className={styles.oilsSection}>
          <div className="container">
            <div className={styles.sectionHead}>
              <div>
                <span className="label-accent">02 — Signature refills</span>
                <h2 className={styles.sectionTitle}>Choose the atmosphere.</h2>
              </div>
              <p className={styles.sectionLede}>
                Four considered fragrance profiles, each developed for automatic diffusion through
                the ScentaRiva machine. Every refill is 500ml and made to be lived with.
              </p>
            </div>

            <div className={styles.oilGrid}>
              {oils.map((oil) => (
                <article key={oil.id} className={styles.oilCard}>
                  <Link href={`/product/${oil.slug}`} className={styles.oilMedia}>
                    {oil.images[0] ? (
                      <img
                        src={thumbnailUrl(oil.images[0], 720)}
                        alt={oil.name}
                        loading="lazy"
                        className={styles.oilImage}
                      />
                    ) : (
                      <div className="skeleton" style={{ width: '100%', height: '100%' }} aria-hidden="true" />
                    )}
                    <span className={styles.oilTag}>500 ml</span>
                  </Link>
                  <div className={styles.oilBody}>
                    <p className={styles.oilNotes}>
                      {FRAGRANCE_NOTES[oil.slug] ?? 'Signature fragrance'}
                    </p>
                    <h3 className={styles.oilName}>
                      <Link href={`/product/${oil.slug}`}>{shortOilName(oil.name)}</Link>
                    </h3>
                    <p className={styles.oilDescription}>{oil.description}</p>
                    <div className={styles.oilFooter}>
                      <span className={styles.oilPrice}>{formatPrice(oil.price)}</span>
                      <button
                        type="button"
                        className={styles.oilAdd}
                        onClick={() => addProduct(oil)}
                        disabled={!oil.inStock}
                        aria-label={`Add ${oil.name} to cart`}
                      >
                        <ShoppingBag size={14} aria-hidden="true" />
                        Add
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="bundle-builder" className={styles.builderSection}>
        <div className="container">
          <div className={styles.sectionHead}>
            <div>
              <span className="label-accent">Build your own</span>
              <h2 className={styles.sectionTitle}>Create your signature set.</h2>
            </div>
            <p className={styles.sectionLede}>
              Pair the ScentaRiva machine with the oils that suit your space, then add an Absolut
              Gold reed diffuser for quieter corners. Build the set once and add it all to your cart.
            </p>
          </div>
          <ScentBundleBuilder products={initialProducts} />
        </div>
      </section>

      {bundles.length > 0 ? (
        <section className={styles.bundlesSection}>
          <div className="container">
            <div className={styles.sectionHead}>
              <div>
                <span className="label-accent">Ready-made bundles</span>
                <h2 className={styles.sectionTitle}>The easiest way to begin.</h2>
              </div>
              <p className={styles.sectionLede}>
                Our curated sets pair the machine with the fragrances that work hardest in a home or
                business — with a saving compared with buying everything separately.
              </p>
            </div>

            <div className={styles.bundleGrid}>
              {bundles.map((bundle) => {
                const saving =
                  bundle.originalPrice && bundle.originalPrice > bundle.price
                    ? bundle.originalPrice - bundle.price
                    : 0;

                return (
                  <article key={bundle.id} className={styles.bundleCard}>
                    <Link href={`/product/${bundle.slug}`} className={styles.bundleMedia}>
                      {bundle.images[0] ? (
                        <img
                          src={thumbnailUrl(bundle.images[0], 1000)}
                          alt={bundle.name}
                          loading="lazy"
                          className={styles.bundleImage}
                        />
                      ) : (
                        <div className="skeleton" style={{ width: '100%', height: '100%' }} aria-hidden="true" />
                      )}
                      {saving > 0 ? <span className={styles.saveTag}>Save {formatPrice(saving)}</span> : null}
                    </Link>
                    <div className={styles.bundleBody}>
                      <p className={styles.bundleTag}>ScentaRiva bundle</p>
                      <h3 className={styles.bundleName}>
                        <Link href={`/product/${bundle.slug}`}>{shortProductName(bundle.name)}</Link>
                      </h3>
                      <p className={styles.bundleDescription}>{bundle.description}</p>
                      <ul className={styles.bundleIncludes}>
                        {bundle.features.slice(0, 4).map((feature) => (
                          <li key={feature}>
                            <Check size={13} aria-hidden="true" /> {feature}
                          </li>
                        ))}
                      </ul>
                      <div className={styles.bundleFooter}>
                        <div className={styles.bundlePriceGroup}>
                          <span className={styles.bundlePrice}>{formatPrice(bundle.price)}</span>
                          {bundle.originalPrice ? (
                            <span className={styles.bundleOriginal}>
                              {formatPrice(bundle.originalPrice)}
                            </span>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          className={styles.addButton}
                          onClick={() => addProduct(bundle, `${shortProductName(bundle.name)} added to cart.`)}
                          disabled={!bundle.inStock}
                        >
                          <ShoppingBag size={15} aria-hidden="true" /> Add bundle
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {reed ? (
        <section className={styles.reedSection}>
          <div className={`container ${styles.reedGrid}`}>
            <div className={styles.reedMedia}>
              <Link href={`/product/${reed.slug}`} className={styles.reedFrame}>
                {reed.images[0] ? (
                  <img
                    src={thumbnailUrl(reed.images[0], 1100)}
                    alt={reed.name}
                    loading="lazy"
                    className={styles.reedImage}
                  />
                ) : (
                  <div className="skeleton" style={{ width: '100%', height: '100%' }} aria-hidden="true" />
                )}
              </Link>
              <span className={styles.mediaTag}>04 — The finishing touch</span>
            </div>
            <div className={styles.reedCopy}>
              <span className="label-accent">Cross-promotion</span>
              <h2 className={styles.sectionTitle}>Absolut Gold, in every quiet corner.</h2>
              <p className={styles.lead}>
                Complete the ScentaRiva ritual with our 150ml Absolut Gold reed diffuser — a
                flameless, continuously diffusing finishing touch for hallways, guest bathrooms,
                bedrooms and reception desks.
              </p>
              <ul className={styles.benefitList}>
                <li>
                  <Check size={14} aria-hidden="true" /> 150ml gold-toned vessel
                </li>
                <li>
                  <Check size={14} aria-hidden="true" /> Natural reeds included
                </li>
                <li>
                  <Check size={14} aria-hidden="true" /> No electricity or flames
                </li>
                <li>
                  <Check size={14} aria-hidden="true" /> Pairs with the ScentaRiva machine
                </li>
              </ul>
              <div className={styles.purchaseRow}>
                <div className={styles.priceBlock}>
                  <span className={styles.price}>{formatPrice(reed.price)}</span>
                  <span className={styles.priceNote}>150ml reed diffuser</span>
                </div>
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => addProduct(reed, 'Absolut Gold reed diffuser added to cart.')}
                  disabled={!reed.inStock}
                >
                  <ShoppingBag size={16} aria-hidden="true" /> Add to cart
                </button>
                <Link href={`/product/${reed.slug}`} className={styles.detailsLink}>
                  Full details <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.processSection}>
        <div className="container">
          <div className={styles.processHead}>
            <div>
              <span className="label-accent">How it works</span>
              <h2 className={styles.sectionTitle}>Beautifully simple, every day.</h2>
            </div>
            <p className={styles.sectionLede}>
              No plumbing, no repeated spraying and no complicated setup. Just a considered
              fragrance ritual that runs quietly in the background.
            </p>
          </div>
          <ol className={styles.processGrid}>
            {SCENT_PROCESS.map((step) => (
              <li key={step.step} className={styles.processStep}>
                <span className={styles.processNumber}>{step.step}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.useCaseSection}>
        <div className="container">
          <div className={styles.sectionHead}>
            <div>
              <span className="label-accent">Where it works</span>
              <h2 className={styles.sectionTitle}>A first impression, before you say a word.</h2>
            </div>
            <p className={styles.sectionLede}>
              ScentaRiva is designed for the spaces people remember — from the front door of a home
              to the lobby of a boutique hotel.
            </p>
          </div>
          <div className={styles.useCaseGrid}>
            {SCENT_USE_CASES.map((useCase) => {
              const Icon = useCaseIcons[useCase.icon];
              return (
                <article key={useCase.title} className={styles.useCaseCard}>
                  <span className={styles.useCaseIcon}>
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <h3>{useCase.title}</h3>
                  <p>{useCase.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.businessSection}>
        <div className={styles.businessBackdrop} aria-hidden="true" />
        <div className={`container ${styles.businessInner}`}>
          <div className={styles.businessCopy}>
            <span className="label-accent">For business</span>
            <h2 className={styles.businessTitle}>Scent is part of your brand.</h2>
            <p>
              Hotels, guest houses, offices, salons, showrooms and restaurants — talk to ZHUA about
              a commercial scent programme, refill scheduling and multiple-machine pricing.
            </p>
            <div className={styles.businessActions}>
              <a
                href={buildWhatsAppUrl(
                  'Hi ZHUA! I would like to discuss a commercial ScentaRiva scent programme for my business.'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <MessageCircle size={16} /> Talk to our team
              </a>
              <Link href="/contact" className="btn btn-ghost">
                Request a quote <ArrowRight size={15} />
              </Link>
            </div>
          </div>
          <div className={styles.businessProof}>
            <div>
              <ShieldCheck size={20} aria-hidden="true" />
              <span>Refillable system</span>
            </div>
            <div>
              <Settings2 size={20} aria-hidden="true" />
              <span>Digital controls</span>
            </div>
            <div>
              <Wind size={20} aria-hidden="true" />
              <span>Automatic diffusion</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.closingSection}>
        <div className={`container ${styles.closingInner}`}>
          <Quote size={28} className={styles.quoteIcon} aria-hidden="true" />
          <blockquote>
            Your space creates a first impression before you even say a word. With ZHUA ScentaRiva,
            make that impression unforgettable.
          </blockquote>
          <p>ZHUA — Experience the Art of Fragrance.</p>
          <div className={styles.closingActions}>
            {machine ? (
              <Link href={`/product/${machine.slug}`} className="btn btn-primary">
                Shop ScentaRiva <ArrowRight size={16} />
              </Link>
            ) : null}
            <a href="#collection" className="btn btn-outline">
              Explore the collection
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
