'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, Minus, Plus, ArrowRight, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store';
import { formatPrice } from '@/lib/data';
import {
  DEFAULT_DELIVERY_ZONES,
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  estimateDefaultStandardDeliveryFee,
  type DeliveryZone,
} from '@/lib/delivery';
import styles from './page.module.css';

type AppliedPromo = {
  code: string;
  discountCents: number;
};

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();
  const [promo, setPromo] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(DEFAULT_FREE_SHIPPING_THRESHOLD);
  const [estimatedDeliveryFee, setEstimatedDeliveryFee] = useState(
    estimateDefaultStandardDeliveryFee(DEFAULT_DELIVERY_ZONES)
  );
  const cartTotal = total();
  const discount = appliedPromo ? appliedPromo.discountCents / 100 : 0;
  const delivery = cartTotal >= freeShippingThreshold ? 0 : estimatedDeliveryFee;
  const grandTotal = cartTotal - discount + delivery;

  useEffect(() => {
    let ignore = false;

    const loadDeliveryConfig = async () => {
      try {
        const res = await fetch('/api/delivery-config');
        const data = (await res.json()) as {
          delivery?: { freeShippingThreshold: number; zones: DeliveryZone[] };
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

        setFreeShippingThreshold(Number(data.delivery.freeShippingThreshold ?? DEFAULT_FREE_SHIPPING_THRESHOLD));
        setEstimatedDeliveryFee(estimateDefaultStandardDeliveryFee(data.delivery.zones));
      } catch {
        // Keep fallback delivery defaults.
      }
    };

    void loadDeliveryConfig();

    return () => {
      ignore = true;
    };
  }, []);

  const applyPromo = async () => {
    const normalizedCode = promo.trim().toUpperCase();
    if (!normalizedCode) {
      toast.error('Enter a promo code first.');
      return;
    }

    setPromoLoading(true);

    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalizedCode, subtotal: cartTotal }),
      });

      const data = (await res.json()) as {
        valid?: boolean;
        promo?: { code: string; discountCents: number };
        error?: string;
      };

      if (!res.ok || !data.valid || !data.promo) {
        throw new Error(data.error ?? 'Promo code is not valid.');
      }

      setAppliedPromo({
        code: data.promo.code,
        discountCents: data.promo.discountCents,
      });
      toast.success(`Promo ${data.promo.code} applied successfully.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Promo code is not valid.';
      setAppliedPromo(null);
      toast.error(message);
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Shopping Cart</h1>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Your cart is empty</p>
            <p className={styles.emptyDesc}>Looks like you haven&apos;t added anything yet.</p>
            <Link href="/shop" className="btn btn-primary">Explore Collection</Link>
          </div>
        ) : (
          <div className={styles.layout}>
            {/* Items */}
            <div className={styles.items}>
              <div className={styles.itemsHeader}>
                <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                <button
                  className={styles.clearBtn}
                  onClick={() => {
                    clearCart();
                    toast.info('Cart cleared.');
                  }}
                >
                  Clear all
                </button>
              </div>

              {items.map(item => (
                <div key={`${item.product.id}-${item.selectedColor}`} className={styles.item}>
                  <div className={styles.itemImg} style={{ background: item.product.colors.find(c => c.name === item.selectedColor)?.hex + '30' || '#3A5673' }}>
                    <svg viewBox="0 0 80 60" style={{ width: '100%', height: '100%', padding: '8px' }}>
                      <rect x="5" y="35" width="70" height="18" rx="4" fill={item.product.colors.find(c => c.name === item.selectedColor)?.hex} fillOpacity="0.6" />
                    </svg>
                  </div>
                  <div className={styles.itemInfo}>
                    <Link href={`/product/${item.product.slug}`} className={styles.itemName}>{item.product.name}</Link>
                    <p className={styles.itemVariant}>
                      {item.selectedColor}{item.selectedSize ? ` · ${item.selectedSize}` : ''}{item.selectedFabric ? ` · ${item.selectedFabric}` : ''}
                      {!item.product.inStock ? ' · Out of stock' : ''}
                    </p>
                    <div className={styles.itemActions}>
                      <div className={styles.qtyRow}>
                        <button className={styles.qtyBtn} onClick={() => updateQuantity(item.product.id, item.selectedColor, item.quantity - 1)}><Minus size={13} /></button>
                        <span className={styles.qty}>{item.quantity}</span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateQuantity(item.product.id, item.selectedColor, item.quantity + 1)}
                          disabled={!item.product.inStock}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        className={styles.removeBtn}
                        onClick={() => {
                          removeItem(item.product.id, item.selectedColor);
                          toast.info(`${item.product.name} removed from cart.`);
                        }}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                  <div className={styles.itemPrice}>
                    <div>{formatPrice(item.product.price * item.quantity)}</div>
                    <div className={styles.itemUnitPrice}>{formatPrice(item.product.price)} each</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className={styles.summary}>
              <h3 className={styles.summaryTitle}>Order Summary</h3>

              <div className={styles.promoForm}>
                <div className={styles.promoInput}>
                  <Tag size={14} />
                  <input type="text" placeholder="Promo code" value={promo} onChange={e => setPromo(e.target.value)} className={styles.promoField} />
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={applyPromo}
                  disabled={promoLoading}
                >
                  {promoLoading ? 'Checking...' : 'Apply'}
                </button>
              </div>
              {appliedPromo ? (
                <p className={styles.promoSuccess}>
                  Promo {appliedPromo.code} applied. -{formatPrice(discount)}
                </p>
              ) : null}

              <div className={styles.summaryRows}>
                <div className={styles.row}><span>Subtotal</span><span>{formatPrice(cartTotal)}</span></div>
                {appliedPromo && <div className={styles.row} style={{ color: '#4ECDC4' }}><span>Promo ({appliedPromo.code})</span><span>−{formatPrice(discount)}</span></div>}
                <div className={styles.row}><span>Delivery</span><span>{delivery === 0 ? <span style={{ color: '#4ECDC4' }}>FREE</span> : formatPrice(delivery)}</span></div>
                <div className={`${styles.row} ${styles.totalRow}`}><span>Total</span><span className={styles.total}>{formatPrice(grandTotal)}</span></div>
              </div>

              <Link
                href={appliedPromo ? `/checkout?promo=${encodeURIComponent(appliedPromo.code)}` : '/checkout'}
                className="btn btn-primary"
                style={{ display: 'flex', justifyContent: 'center', width: '100%' }}
              >
                Checkout <ArrowRight size={16} />
              </Link>
              <p className={styles.summaryNote}>Taxes included · Secure checkout powered by PayFast & Yoco</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
