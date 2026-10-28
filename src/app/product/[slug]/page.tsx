'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Hammer,
  Heart,
  MessageCircle,
  RotateCcw,
  Shield,
  ShoppingBag,
  Star,
  Truck,
  ZoomIn,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, products, type Product } from '@/lib/data';
import { useCartStore, useWishlistStore } from '@/store';
import { useStorefrontProducts } from '@/lib/use-storefront-products';
import { DEFAULT_DELIVERY_ZONES, type DeliveryZone } from '@/lib/delivery';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import ProductImageLightbox from '@/components/ui/ProductImageLightbox';
import styles from './page.module.css';

type RelatedImagePreviewState = {
  productName: string;
  images: string[];
  index: number;
};

const badgeLabels: Record<NonNullable<Product['badge']>, string> = {
  bestseller: 'Bestseller',
  custom: 'Made to order',
  new: 'New arrival',
  sale: 'On sale',
};

function toPreviewImages(images: string[]): string[] {
  return images.filter((image) => typeof image === 'string' && image.trim().length > 0);
}

/** Ask Cloudinary for a right-sized derivative; leave local assets untouched. */
function imageUrl(url: string, width: number): string {
  if (!url.includes('/image/upload/')) {
    return url;
  }

  return url.replace('/image/upload/', `/image/upload/w_${width},q_auto,f_auto/`);
}

function categoryHref(category: Product['category']): string {
  if (category === 'furniture') {
    return '/furniture';
  }

  return `/shop/${category}`;
}

function categoryLabel(category: Product['category']): string {
  if (category === 'furniture') {
    return 'Furniture';
  }

  if (category === 'curtains') {
    return 'Curtains & blinds';
  }

  return 'Accessories';
}

export default function ProductPage() {
  const { products: liveProducts } = useStorefrontProducts();
  const routeParams = useParams<{ slug: string }>();
  const slug = routeParams?.slug ?? '';
  const product =
    liveProducts.find((entry) => entry.slug === slug) || liveProducts[0] || products[0];

  const colorOptions =
    product.colors.length > 0 ? product.colors : [{ name: 'Default', hex: '#B59241' }];
  const sizeOptions = Array.isArray(product.sizes)
    ? product.sizes.filter((entry) => typeof entry === 'string' && entry.trim().length > 0)
    : [];
  const fabricOptions = Array.isArray(product.fabrics)
    ? product.fabrics.filter((entry) => typeof entry === 'string' && entry.trim().length > 0)
    : [];

  const [selectedColorName, setSelectedColorName] = useState(colorOptions[0]?.name ?? 'Default');
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0] || '');
  const [selectedFabric, setSelectedFabric] = useState(fabricOptions[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [province, setProvince] = useState('');
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(DEFAULT_DELIVERY_ZONES);
  const [imgIndex, setImgIndex] = useState(0);
  const [isMainLightboxOpen, setIsMainLightboxOpen] = useState(false);
  const [relatedImagePreview, setRelatedImagePreview] =
    useState<RelatedImagePreviewState | null>(null);
  const [added, setAdded] = useState(false);

  const { addItem } = useCartStore();
  const { toggle, has } = useWishlistStore();

  useEffect(() => {
    void fetch('/api/account/activity/product-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, slug: product.slug }),
    });
  }, [product.id, product.slug]);

  useEffect(() => {
    let ignore = false;

    const loadDeliveryConfig = async () => {
      try {
        const res = await fetch('/api/delivery-config');
        const data = (await res.json()) as {
          delivery?: { zones: DeliveryZone[] };
        };

        if (
          ignore ||
          !res.ok ||
          !data.delivery ||
          !Array.isArray(data.delivery.zones) ||
          data.delivery.zones.length === 0
        ) {
          return;
        }

        setDeliveryZones(data.delivery.zones);
      } catch {
        // Keep the built-in delivery defaults.
      }
    };

    void loadDeliveryConfig();

    return () => {
      ignore = true;
    };
  }, []);

  const selectedColor =
    colorOptions.find((entry) => entry.name === selectedColorName) ??
    colorOptions[0] ??
    { name: 'Default', hex: '#B59241' };
  const hasSizeOptions = sizeOptions.length > 0;
  const hasFabricOptions = fabricOptions.length > 0;
  const activeSize = sizeOptions.includes(selectedSize) ? selectedSize : sizeOptions[0] || '';
  const activeFabric = fabricOptions.includes(selectedFabric)
    ? selectedFabric
    : fabricOptions[0] || '';
  const isOutOfStock = !product.inStock;
  const delivery = deliveryZones.find((zone) => zone.id === province);

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error(`${product.name} is out of stock.`);
      return;
    }

    addItem({
      product,
      quantity,
      selectedColor: selectedColor.name,
      selectedSize: activeSize,
      selectedFabric: activeFabric,
    });
    toast.success(`${product.name} added to cart.`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const related = liveProducts
    .filter((entry) => entry.category === product.category && entry.id !== product.id)
    .slice(0, 4);
  const weightKg = Number(product.weightKg ?? 0);
  const widthCm = Number(product.dimensions?.widthCm ?? 0);
  const depthCm = Number(product.dimensions?.depthCm ?? 0);
  const heightCm = Number(product.dimensions?.heightCm ?? 0);
  const hasPhysicalSpecs = weightKg > 0 || widthCm > 0 || depthCm > 0 || heightCm > 0;
  const colorImages = Array.isArray(selectedColor.images)
    ? toPreviewImages(selectedColor.images)
    : [];
  const galleryImages = colorImages.length > 0 ? colorImages : product.images;
  const galleryPreviewImages = toPreviewImages(galleryImages);
  const imgCount = galleryImages.length;
  const safeImgIndex = Math.min(imgIndex, Math.max(0, imgCount - 1));
  const saving =
    product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice - product.price
      : 0;
  const story = product.longDescription?.trim() ? product.longDescription : null;
  const AvailabilityIcon = !product.inStock ? Shield : product.isCustomizable ? Hammer : Truck;
  const availabilityNote = !product.inStock
    ? 'Currently out of stock. Talk to us about the next production run.'
    : product.isCustomizable
      ? 'Made to order in our Johannesburg workshop.'
      : 'Ready to deliver across South Africa.';

  const openRelatedImagePreview = (
    relatedProductName: string,
    relatedProductImages: string[],
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const previewImages = toPreviewImages(relatedProductImages);
    if (previewImages.length === 0) {
      return;
    }

    setRelatedImagePreview({
      productName: relatedProductName,
      images: previewImages,
      index: 0,
    });
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.masthead}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href={categoryHref(product.category)}>{categoryLabel(product.category)}</Link>
            <span aria-hidden="true">/</span>
            <span className={styles.breadcrumbCurrent}>{product.name}</span>
          </nav>
          <p className={styles.mastheadNote}>
            <AvailabilityIcon size={14} aria-hidden="true" />
            {availabilityNote}
          </p>
        </header>

        <div className={styles.shell}>
          <section
            className={`${styles.gallery} ${imgCount <= 1 ? styles.galleryNoThumbs : ''}`}
            aria-label="Product images"
          >
            {imgCount > 1 ? (
              <div className={styles.thumbs} role="group" aria-label="Choose product image">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={`${styles.thumb} ${index === safeImgIndex ? styles.thumbActive : ''}`}
                    onClick={() => setImgIndex(index)}
                    aria-label={`Show image ${index + 1} of ${imgCount}`}
                    aria-pressed={index === safeImgIndex}
                  >
                    <img
                      src={imageUrl(image, 240)}
                      alt=""
                      className={styles.thumbImage}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            ) : null}

            <div className={styles.stage}>
              <div className={styles.stageTop}>
                <span className={styles.stageTag}>{selectedColor.name}</span>
              </div>

              <div className={styles.stageFrame}>
                {galleryImages[safeImgIndex] ? (
                  <button
                    type="button"
                    className={styles.stageButton}
                    onClick={() => setIsMainLightboxOpen(true)}
                    aria-label="Open product image fullscreen"
                  >
                    <img
                      key={safeImgIndex}
                      src={imageUrl(galleryImages[safeImgIndex], 1400)}
                      alt={`${product.name} image ${safeImgIndex + 1}`}
                      className={styles.stageImage}
                    />
                  </button>
                ) : (
                  <ProductHeroSVG category={product.category} color={selectedColor.hex} />
                )}
              </div>

              <div className={styles.stageFooter}>
                <span className={styles.stageCount}>
                  {imgCount > 0
                    ? `${String(safeImgIndex + 1).padStart(2, '0')} / ${String(imgCount).padStart(2, '0')}`
                    : 'ZHUA Furniture'}
                </span>
                <div className={styles.stageControls}>
                  {imgCount > 1 ? (
                    <>
                      <button
                        type="button"
                        className={styles.stageControl}
                        onClick={() => setImgIndex(Math.max(0, safeImgIndex - 1))}
                        aria-label="Previous image"
                        disabled={safeImgIndex === 0}
                      >
                        <ChevronLeft size={17} />
                      </button>
                      <button
                        type="button"
                        className={styles.stageControl}
                        onClick={() => setImgIndex(Math.min(imgCount - 1, safeImgIndex + 1))}
                        aria-label="Next image"
                        disabled={safeImgIndex === imgCount - 1}
                      >
                        <ChevronRight size={17} />
                      </button>
                    </>
                  ) : null}
                  {galleryImages[safeImgIndex] ? (
                    <button
                      type="button"
                      className={styles.stageControl}
                      onClick={() => setIsMainLightboxOpen(true)}
                      aria-label="Zoom image"
                    >
                      <ZoomIn size={16} />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className={styles.info} aria-labelledby="product-title">
            <div className={styles.metaLine}>
              <span className={styles.metaCategory}>{product.subcategory || 'Furniture'}</span>
              {product.badge ? (
                <span className={styles.badge}>{badgeLabels[product.badge] ?? product.badge}</span>
              ) : null}
              {product.isCustomizable ? (
                <span className={styles.metaCustom}>Made to your specification</span>
              ) : null}
            </div>

            <h1 id="product-title" className={styles.name}>
              {product.name}
            </h1>

            <div className={styles.ratingRow}>
              {product.reviewCount > 0 ? (
                <>
                  <div className={styles.stars} aria-hidden="true">
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        size={13}
                        fill={index < Math.floor(product.rating) ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <span className={styles.ratingNum}>{Number(product.rating || 0).toFixed(1)}</span>
                  <Link href="/reviews" className={styles.ratingLink}>
                    {product.reviewCount} reviews
                  </Link>
                </>
              ) : (
                <Link href="/reviews" className={styles.ratingLink}>
                  Be the first to review
                </Link>
              )}
            </div>

            <div className={styles.priceBlock}>
              <span className={styles.price}>{formatPrice(product.price)}</span>
              {product.originalPrice ? (
                <span className={styles.originalPrice}>{formatPrice(product.originalPrice)}</span>
              ) : null}
              {saving > 0 ? <span className={styles.saving}>Save {formatPrice(saving)}</span> : null}
            </div>

            <p className={styles.desc}>{product.description}</p>

            <div className={styles.config}>
              <div className={styles.field} role="group" aria-labelledby="colour-label">
                <span id="colour-label" className={styles.fieldLabel}>
                  Colour <em className={styles.fieldValue}>{selectedColor.name}</em>
                </span>
                <div className={styles.swatches}>
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      className={`${styles.swatch} ${
                        color.name === selectedColor.name ? styles.swatchActive : ''
                      }`}
                      style={{ background: color.hex }}
                      onClick={() => {
                        if (color.name !== selectedColor.name) {
                          setImgIndex(0);
                        }
                        setSelectedColorName(color.name);
                      }}
                      aria-label={`Select ${color.name}`}
                      aria-pressed={color.name === selectedColor.name}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.field} role="group" aria-labelledby="size-label">
                <span id="size-label" className={styles.fieldLabel}>
                  Size <em className={styles.fieldValue}>{hasSizeOptions ? activeSize : 'Not specified'}</em>
                </span>
                {hasSizeOptions ? (
                  <div className={styles.options}>
                    {sizeOptions.map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={`${styles.option} ${
                          size === activeSize ? styles.optionActive : ''
                        }`}
                        onClick={() => setSelectedSize(size)}
                        aria-pressed={size === activeSize}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className={styles.field} role="group" aria-labelledby="fabric-label">
                <span id="fabric-label" className={styles.fieldLabel}>
                  Fabric <em className={styles.fieldValue}>{hasFabricOptions ? activeFabric : 'Not specified'}</em>
                </span>
                {hasFabricOptions ? (
                  <div className={styles.options}>
                    {fabricOptions.map((fabric) => (
                      <button
                        key={fabric}
                        type="button"
                        className={`${styles.option} ${
                          fabric === activeFabric ? styles.optionActive : ''
                        }`}
                        onClick={() => setSelectedFabric(fabric)}
                        aria-pressed={fabric === activeFabric}
                      >
                        {fabric}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Quantity</span>
                <div className={styles.qtyControl}>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className={styles.qty}>{quantity}</span>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={isOutOfStock}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.purchase}>
              <button
                type="button"
                className={styles.addBtn}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? (
                  <>
                    <ShoppingBag size={18} /> Out of stock
                  </>
                ) : added ? (
                  <>
                    <Check size={18} /> Added to cart
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} /> Add to cart
                  </>
                )}
              </button>
              <button
                type="button"
                className={`${styles.wishBtn} ${has(product.id) ? styles.wishBtnActive : ''}`}
                onClick={async () => {
                  const alreadyWishlisted = has(product.id);
                  await toggle(product.id);
                  toast.success(
                    alreadyWishlisted
                      ? `${product.name} removed from wishlist.`
                      : `${product.name} added to wishlist.`
                  );
                }}
                aria-label={
                  has(product.id)
                    ? `Remove ${product.name} from wishlist`
                    : `Add ${product.name} to wishlist`
                }
                aria-pressed={has(product.id)}
              >
                <Heart size={19} fill={has(product.id) ? 'currentColor' : 'none'} />
              </button>
            </div>

            <a
              href={buildWhatsAppUrl(
                `Hi! I'm interested in the ${product.name}. Can you help me?`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.quoteLink}
            >
              <MessageCircle size={16} /> Request a WhatsApp quote
            </a>

            <div className={styles.paymentRow}>
              <span className={styles.payLabel}>Pay with</span>
              {['PayFast', 'Yoco', 'Payflex'].map((provider) => (
                <span key={provider} className={styles.payBadge}>
                  {provider}
                </span>
              ))}
            </div>

            <div className={styles.ledger}>
              <div className={styles.block}>
                <h2 className={styles.blockTitle}>Delivery</h2>
                <p className={styles.blockNote}>
                  {product.isCustomizable ? 'Made to order.' : 'Ready to dispatch.'}
                  {product.deliveryDays ? ` Estimated ${product.deliveryDays}.` : ''}
                </p>
                <label className={styles.selectLabel} htmlFor="delivery-province">
                  Delivery province
                </label>
                <select
                  id="delivery-province"
                  className={styles.select}
                  value={province}
                  onChange={(event) => setProvince(event.target.value)}
                >
                  <option value="">Select your province</option>
                  {deliveryZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
                {delivery ? (
                  <div className={styles.deliveryRows}>
                    <div className={styles.deliveryRow}>
                      <span>Standard</span>
                      <span>
                        {delivery.standardDays} days,{' '}
                        {delivery.standardFee === 0 ? 'free' : formatPrice(delivery.standardFee)}
                      </span>
                    </div>
                    <div className={styles.deliveryRow}>
                      <span>Express</span>
                      <span>
                        {delivery.expressDays} days, {formatPrice(delivery.expressFee)}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              {product.features.length > 0 ? (
                <div className={styles.block}>
                  <h2 className={styles.blockTitle}>What&apos;s included</h2>
                  <ul className={styles.featureList}>
                    {product.features.map((feature) => (
                      <li key={feature} className={styles.featureItem}>
                        <Check size={13} aria-hidden="true" /> {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {hasPhysicalSpecs ? (
                <div className={styles.block}>
                  <h2 className={styles.blockTitle}>Specifications</h2>
                  <dl className={styles.specList}>
                    {weightKg > 0 ? (
                      <div className={styles.specRow}>
                        <dt>Weight</dt>
                        <dd>{weightKg} kg</dd>
                      </div>
                    ) : null}
                    {widthCm > 0 || depthCm > 0 || heightCm > 0 ? (
                      <div className={styles.specRow}>
                        <dt>Dimensions</dt>
                        <dd>
                          {widthCm} × {depthCm} × {heightCm} cm
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              ) : null}
            </div>

            <div className={styles.trustRow}>
              <span>
                <Shield size={14} aria-hidden="true" /> 1-year warranty
              </span>
              <span>
                <RotateCcw size={14} aria-hidden="true" /> 30-day returns
              </span>
              <span>
                <Truck size={14} aria-hidden="true" /> Delivery across South Africa
              </span>
            </div>
          </section>
        </div>

        {story ? (
          <section className={styles.story} aria-labelledby="story-title">
            <div className={styles.storyCopy}>
              <h2 id="story-title" className={styles.storyTitle}>
                Built around the room it lives in.
              </h2>
              <p className={styles.storyText}>{story}</p>
            </div>
            <dl className={styles.storySpecs}>
              <div>
                <dt>Lead time</dt>
                <dd>{product.deliveryDays || 'Made to order'}</dd>
              </div>
              <div>
                <dt>Customisation</dt>
                <dd>
                  {product.isCustomizable
                    ? 'Sizes, fabrics and finishes on request'
                    : 'As shown'}
                </dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>All nine provinces</dd>
              </div>
              {weightKg > 0 ? (
                <div>
                  <dt>Weight</dt>
                  <dd>{weightKg} kg</dd>
                </div>
              ) : null}
              {hasPhysicalSpecs ? (
                <div>
                  <dt>Dimensions</dt>
                  <dd>
                    {widthCm} × {depthCm} × {heightCm} cm
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}

        {related.length > 0 ? (
          <section className={styles.related} aria-labelledby="related-title">
            <div className={styles.relatedHead}>
              <h2 id="related-title" className={styles.relatedTitle}>
                {product.category === 'furniture' ? 'Complete the room' : 'You might also like'}
              </h2>
              <Link
                href={product.category === 'furniture' ? '/furniture#collection' : '/shop'}
                className={styles.relatedAll}
              >
                {product.category === 'furniture' ? 'See all furniture' : 'See all products'}
              </Link>
            </div>
            <div className={styles.relatedGrid}>
              {related.map((entry) => (
                <Link key={entry.id} href={`/product/${entry.slug}`} className={styles.relatedCard}>
                  <div className={styles.relatedStage}>
                    {entry.images[0] ? (
                      <button
                        type="button"
                        className={styles.relatedZoom}
                        onClick={(event) =>
                          openRelatedImagePreview(entry.name, entry.images, event)
                        }
                        aria-label={`Preview ${entry.name} image`}
                      >
                        <ZoomIn size={15} />
                      </button>
                    ) : null}
                    {entry.images[0] ? (
                      <img
                        src={imageUrl(entry.images[0], 640)}
                        alt={entry.name}
                        className={styles.relatedImage}
                        loading="lazy"
                      />
                    ) : (
                      <ProductHeroSVG
                        category={entry.category}
                        color={entry.colors[0]?.hex ?? '#B59241'}
                      />
                    )}
                  </div>
                  <div className={styles.relatedInfo}>
                    <h3 className={styles.relatedName}>{entry.name}</h3>
                    <span className={styles.relatedPrice}>{formatPrice(entry.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <ProductImageLightbox
          isOpen={isMainLightboxOpen}
          images={galleryPreviewImages}
          activeIndex={safeImgIndex}
          onChangeIndex={setImgIndex}
          onClose={() => setIsMainLightboxOpen(false)}
          productName={product.name}
        />

        <ProductImageLightbox
          isOpen={Boolean(relatedImagePreview)}
          images={relatedImagePreview?.images ?? []}
          activeIndex={relatedImagePreview?.index ?? 0}
          onChangeIndex={(index) =>
            setRelatedImagePreview((previous) =>
              previous
                ? {
                    ...previous,
                    index,
                  }
                : previous
            )
          }
          onClose={() => setRelatedImagePreview(null)}
          productName={relatedImagePreview?.productName ?? 'Product image'}
        />
      </div>
    </div>
  );
}

function ProductHeroSVG({ category, color }: { category: string; color: string }) {
  if (category === 'furniture') return (
    <svg viewBox="0 0 300 220" style={{ width: '100%', height: '100%' }}>
      <rect x="30" y="140" width="240" height="50" rx="8" fill={color} fillOpacity="0.25" />
      <rect x="38" y="95" width="224" height="52" rx="8" fill={color} fillOpacity="0.45" />
      <rect x="30" y="108" width="28" height="80" rx="8" fill={color} fillOpacity="0.6" />
      <rect x="242" y="108" width="28" height="80" rx="8" fill={color} fillOpacity="0.6" />
      <rect x="60" y="148" width="80" height="34" rx="6" fill={color} fillOpacity="0.7" />
      <rect x="160" y="148" width="80" height="34" rx="6" fill={color} fillOpacity="0.7" />
    </svg>
  );
  if (category === 'curtains') return (
    <svg viewBox="0 0 300 220" style={{ width: '100%', height: '100%' }}>
      <rect x="20" y="20" width="260" height="8" rx="4" fill={color} fillOpacity="0.5" />
      <path d="M20 28 Q55 90 40 210 L20 210 Z" fill={color} fillOpacity="0.5" />
      <path d="M280 28 Q245 90 260 210 L280 210 Z" fill={color} fillOpacity="0.5" />
      {[35,60,85,110,140,170,195,220,245,270].map((x,i) => <circle key={i} cx={x} cy="24" r="7" fill={color} fillOpacity="0.7" />)}
      <rect x="80" y="50" width="140" height="160" fill={color} fillOpacity="0.06" rx="4" />
    </svg>
  );
  return (
    <svg viewBox="0 0 300 220" style={{ width: '100%', height: '100%' }}>
      <rect x="142" y="155" width="16" height="55" rx="4" fill={color} fillOpacity="0.4" />
      <rect x="100" y="205" width="100" height="12" rx="4" fill={color} fillOpacity="0.25" />
      <ellipse cx="150" cy="90" rx="55" ry="70" fill={color} fillOpacity="0.15" />
      <ellipse cx="150" cy="90" rx="36" ry="48" fill={color} fillOpacity="0.3" />
      <ellipse cx="150" cy="90" rx="20" ry="28" fill={color} fillOpacity="0.5" />
      <circle cx="150" cy="90" r="10" fill={color} fillOpacity="0.9" />
    </svg>
  );
}
