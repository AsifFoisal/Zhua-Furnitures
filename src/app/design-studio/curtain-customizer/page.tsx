'use client';
import { useState } from 'react';
import { fabricOptions, headingStyles, formatPrice, products as fallbackProducts } from '@/lib/data';
import { useCartStore } from '@/store';
import { toast } from 'sonner';
import { MessageCircle, ShoppingBag } from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { useStorefrontProducts } from '@/lib/use-storefront-products';
import ComingSoonPanel from '@/components/ui/ComingSoonPanel';
import { DESIGN_STUDIO_FEATURE } from '@/lib/features';
import styles from './page.module.css';

const colors = [
  { name: 'Stone Beige', hex: '#C8BCA8' }, { name: 'Ivory White', hex: '#F0EAD6' },
  { name: 'Rust Terracotta', hex: '#B85C38' }, { name: 'Sage Green', hex: '#7A9E7E' },
  { name: 'Midnight Navy', hex: '#2C3E6B' }, { name: 'Charcoal', hex: '#3A3530' },
  { name: 'Pale Blush', hex: '#E8C4B8' }, { name: 'Warm Gold', hex: '#C9A84C' },
];
const linings = ['Unlined', 'Thermal Lining', 'Block-Out Lining', 'Interlined'];
const lengths = ['Floor Length (280cm)', 'Mid Length (180cm)', 'Sill Length (120cm)', 'Custom'];
const fullnesses = [{ v: 1.5, label: '1.5× (Casual)' }, { v: 2, label: '2× (Standard)' }, { v: 2.5, label: '2.5× (Luxurious)' }];

export default function CurtainCustomizerPage() {
  if (!DESIGN_STUDIO_FEATURE.enabled) {
    return (
      <ComingSoonPanel
        title="Curtain Customizer Is Almost Here"
        message={DESIGN_STUDIO_FEATURE.message}
        primaryCta={{ label: 'Shop Curtains', href: '/shop/curtains' }}
        secondaryCta={{ label: 'Contact Us', href: '/contact' }}
      />
    );
  }

  return <CurtainCustomizerWorkspace />;
}

function CurtainCustomizerWorkspace() {
  const { products: liveProducts } = useStorefrontProducts();
  const [selectedFabric, setSelectedFabric] = useState(fabricOptions[0]);
  const [selectedHeading, setSelectedHeading] = useState(headingStyles[0]);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [selectedLining, setSelectedLining] = useState(linings[0]);
  const [selectedLength, setSelectedLength] = useState(lengths[0]);
  const [fullness, setFullness] = useState(2);
  const pricePerMetre = selectedFabric.price;
  const baseMetres = 3.5;
  const totalMetres = +(baseMetres * fullness).toFixed(1);
  const totalPrice = Math.round(totalMetres * pricePerMetre + 350); // + making charge
  const { addItem } = useCartStore();
  const baseProduct =
    liveProducts.find((product) => product.category === 'curtains') ||
    fallbackProducts.find((product) => product.category === 'curtains') ||
    fallbackProducts[0];
  const isOutOfStock = !baseProduct?.inStock;

  const handleAddCustomOrder = () => {
    if (!baseProduct || isOutOfStock) {
      toast.error('This custom curtain base product is out of stock.');
      return;
    }

    addItem({
      product: baseProduct,
      quantity: 1,
      selectedColor: selectedColor.name,
      selectedFabric: selectedFabric.name,
      customNote: `Custom curtains: ${selectedFabric.name}, ${selectedColor.name}, ${selectedHeading.name}, ${selectedLining}, ${selectedLength}, fullness ${fullness}x`,
    });
    toast.success('Custom curtain configuration added to cart.');
  };

  return (
    <div className={styles.page}>
      <div className="container-wide">
        <div className={styles.header}>
          <span className="label-accent">Design Studio</span>
          <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '0.75rem 0 0.5rem' }}>Curtain Customiser</h1>
          <p style={{ color: '#A9B7C9' }}>Select your fabric, heading style, colour, and lining — then see a live preview of your custom curtains.</p>
        </div>

        <div className={styles.workspace}>
          {/* Options Panel */}
          <div className={styles.panel}>
            {/* Fabric */}
            <div className={styles.group}>
              <h3 className={styles.groupTitle}>Fabric <span className={styles.priceTag}>{formatPrice(selectedFabric.price)}/m</span></h3>
              <div className={styles.fabricGrid}>
                {fabricOptions.map(f => (
                  <button key={f.id} className={`${styles.fabricChip} ${f.id === selectedFabric.id ? styles.fabricChipActive : ''}`}
                    style={{ '--swatch': f.texture } as React.CSSProperties} onClick={() => setSelectedFabric(f)}>
                    <div className={styles.fabricSwatch} style={{ background: f.texture }} />
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className={styles.group}>
              <h3 className={styles.groupTitle}>Colour: <span style={{ color: '#EAF0F8', fontWeight: 400 }}>{selectedColor.name}</span></h3>
              <div className={styles.colorRow}>
                {colors.map(c => (
                  <button key={c.name} className={`${styles.colorDot} ${c.name === selectedColor.name ? styles.colorDotActive : ''}`}
                    style={{ background: c.hex }} onClick={() => setSelectedColor(c)} title={c.name} />
                ))}
              </div>
            </div>

            {/* Heading */}
            <div className={styles.group}>
              <h3 className={styles.groupTitle}>Heading Style</h3>
              <div className={styles.headingGrid}>
                {headingStyles.map(h => (
                  <button key={h.id} className={`${styles.headingChip} ${h.id === selectedHeading.id ? styles.headingChipActive : ''}`}
                    onClick={() => setSelectedHeading(h)}>
                    <div className={styles.headingName}>{h.name}</div>
                    <div className={styles.headingDesc}>{h.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lining */}
            <div className={styles.group}>
              <h3 className={styles.groupTitle}>Lining</h3>
              <div className={styles.pillRow}>
                {linings.map(l => (
                  <button key={l} className={`${styles.pill} ${l === selectedLining ? styles.pillActive : ''}`}
                    onClick={() => setSelectedLining(l)}>{l}</button>
                ))}
              </div>
            </div>

            {/* Length */}
            <div className={styles.group}>
              <h3 className={styles.groupTitle}>Length</h3>
              <div className={styles.pillRow}>
                {lengths.map(l => (
                  <button key={l} className={`${styles.pill} ${l === selectedLength ? styles.pillActive : ''}`}
                    onClick={() => setSelectedLength(l)}>{l}</button>
                ))}
              </div>
            </div>

            {/* Fullness */}
            <div className={styles.group}>
              <h3 className={styles.groupTitle}>Fullness</h3>
              <div className={styles.pillRow}>
                {fullnesses.map(f => (
                  <button key={f.v} className={`${styles.pill} ${f.v === fullness ? styles.pillActive : ''}`}
                    onClick={() => setFullness(f.v)}>{f.label}</button>
                ))}
              </div>
            </div>

            {/* Price Summary */}
            <div className={styles.priceSummary}>
              <div className={styles.priceRow}><span>Fabric ({totalMetres}m @ {formatPrice(pricePerMetre)}/m)</span><span>{formatPrice(totalMetres * pricePerMetre)}</span></div>
              <div className={styles.priceRow}><span>Making charge</span><span>{formatPrice(350)}</span></div>
              <div className={`${styles.priceRow} ${styles.priceTotal}`}><span>Estimated Total</span><span>{formatPrice(totalPrice)}</span></div>
            </div>

            <div className={styles.ctaGroup}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={handleAddCustomOrder}
                disabled={isOutOfStock}
              >
                <ShoppingBag size={15} /> {isOutOfStock ? 'Out of Stock' : 'Add Custom Order'}
              </button>
              <a href={buildWhatsAppUrl(`Hi! I'd like a quote for custom curtains: ${selectedFabric.name} fabric, ${selectedColor.name} colour, ${selectedHeading.name} heading, ${selectedLength}. Estimated R${totalPrice}.`)}
                target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp" style={{ flex: 1, justifyContent: 'center' }}>
                <MessageCircle size={15} /> WhatsApp Quote
              </a>
            </div>
          </div>

          {/* Live Preview */}
          <div className={styles.preview}>
            <div className={styles.previewLabel}>Live Preview</div>
            <div className={styles.previewWindow}>
              {/* Window surround */}
              <div className={styles.windowFrame}>
                <div className={styles.windowGlass} />
                {/* Curtain Rod */}
                <div className={styles.curtainRod}>
                  {/* Heading details */}
                  <div className={styles.curtainHeading} style={{ background: selectedColor.hex }}>
                    {selectedHeading.id === 'eyelet' && (
                      <div className={styles.eyelets}>
                        {[...Array(8)].map((_, i) => <div key={i} className={styles.eyelet} style={{ borderColor: selectedColor.hex }} />)}
                      </div>
                    )}
                    {selectedHeading.id === 'pinch-pleat' && (
                      <div className={styles.pinches}>
                        {[...Array(6)].map((_, i) => <div key={i} className={styles.pinch} style={{ background: `color-mix(in srgb, ${selectedColor.hex} 80%, black)` }} />)}
                      </div>
                    )}
                    {selectedHeading.id === 'wave' && (
                      <div className={styles.waveFolds}>
                        {[...Array(5)].map((_, i) => <div key={i} className={styles.waveFold} style={{ background: selectedColor.hex, opacity: i % 2 === 0 ? 0.8 : 1 }} />)}
                      </div>
                    )}
                  </div>
                  {/* Left panel */}
                  <div className={styles.curtainLeft} style={{
                    background: `linear-gradient(180deg, ${selectedColor.hex} 0%, color-mix(in srgb, ${selectedColor.hex} 85%, black) 100%)`,
                    height: selectedLength.includes('280') ? '340px' : selectedLength.includes('180') ? '220px' : '160px',
                    opacity: selectedFabric.id === 'sheer-voile' ? 0.35 : selectedFabric.id.includes('blockout') ? 1 : 0.85,
                  }}>
                    <div className={styles.curtainFold} style={{ background: `color-mix(in srgb, ${selectedColor.hex} 70%, black)` }} />
                    <div className={styles.curtainFold} style={{ background: `color-mix(in srgb, ${selectedColor.hex} 70%, black)`, left: '55%' }} />
                  </div>
                  {/* Right panel */}
                  <div className={styles.curtainRight} style={{
                    background: `linear-gradient(180deg, ${selectedColor.hex} 0%, color-mix(in srgb, ${selectedColor.hex} 85%, black) 100%)`,
                    height: selectedLength.includes('280') ? '340px' : selectedLength.includes('180') ? '220px' : '160px',
                    opacity: selectedFabric.id === 'sheer-voile' ? 0.35 : selectedFabric.id.includes('blockout') ? 1 : 0.85,
                  }}>
                    <div className={styles.curtainFold} style={{ background: `color-mix(in srgb, ${selectedColor.hex} 70%, black)` }} />
                    <div className={styles.curtainFold} style={{ background: `color-mix(in srgb, ${selectedColor.hex} 70%, black)`, left: '55%' }} />
                  </div>
                </div>
              </div>

              <div className={styles.previewMeta}>
                <span>{selectedFabric.name} · {selectedColor.name} · {selectedHeading.name}</span>
                <span>{selectedLining} · {selectedLength}</span>
              </div>
            </div>

            {/* Spec Summary */}
            <div className={styles.specBox}>
              <div className={styles.specGrid}>
                {[
                  { label: 'Fabric', value: selectedFabric.name },
                  { label: 'Colour', value: selectedColor.name },
                  { label: 'Heading', value: selectedHeading.name },
                  { label: 'Lining', value: selectedLining },
                  { label: 'Length', value: selectedLength },
                  { label: 'Fullness', value: `${fullness}× (${totalMetres}m total)` },
                ].map(s => (
                  <div key={s.label} className={styles.spec}>
                    <span className={styles.specLabel}>{s.label}</span>
                    <span className={styles.specValue}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
