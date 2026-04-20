'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store';
import { formatPrice } from '@/lib/data';
import { DEFAULT_FREE_SHIPPING_THRESHOLD } from '@/lib/delivery';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, total, itemCount } = useCartStore();
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(DEFAULT_FREE_SHIPPING_THRESHOLD);
  const count = itemCount();
  const cartTotal = total();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    let ignore = false;

    const loadDeliveryConfig = async () => {
      try {
        const res = await fetch('/api/delivery-config');
        const data = (await res.json()) as { delivery?: { freeShippingThreshold: number } };
        if (ignore || !res.ok || !data.delivery) {
          return;
        }

        setFreeShippingThreshold(Number(data.delivery.freeShippingThreshold ?? DEFAULT_FREE_SHIPPING_THRESHOLD));
      } catch {
        // Keep fallback threshold.
      }
    };

    void loadDeliveryConfig();

    return () => {
      ignore = true;
    };
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={closeCart} />
      <div className={styles.drawer}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <ShoppingBag size={20} className={styles.headerIcon} />
            <h2 className={styles.headerTitle}>Your Cart</h2>
            {count > 0 && <span className={styles.headerBadge}>{count}</span>}
          </div>
          <button className={styles.closeBtn} onClick={closeCart} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className={styles.items}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <ShoppingBag size={48} />
              </div>
              <p className={styles.emptyTitle}>Your cart is empty</p>
              <p className={styles.emptyDesc}>Explore our collection and add something beautiful to your home.</p>
              <button className="btn btn-primary btn-sm" onClick={closeCart}>
                Shop Now
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.product.id}-${item.selectedColor}`} className={styles.item}>
                <div className={styles.itemImage}>
                  <div className={styles.itemImagePlaceholder} style={{ background: item.product.colors.find(c => c.name === item.selectedColor)?.hex || '#3A5673' }} />
                </div>
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{item.product.name}</p>
                  <p className={styles.itemVariant}>
                    {item.selectedColor}
                    {item.selectedSize && ` · ${item.selectedSize}`}
                    {item.selectedFabric && ` · ${item.selectedFabric}`}
                    {!item.product.inStock && ' · Out of stock'}
                  </p>
                  <div className={styles.itemActions}>
                    <div className={styles.qtyControl}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.product.id, item.selectedColor, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className={styles.qty}>{item.quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.product.id, item.selectedColor, item.quantity + 1)}
                        aria-label="Increase quantity"
                        disabled={!item.product.inStock}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => {
                        removeItem(item.product.id, item.selectedColor);
                        toast.info(`${item.product.name} removed from cart.`);
                      }}
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className={styles.itemPrice}>{formatPrice(item.product.price * item.quantity)}</div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.freeShipping}>
              <div className={styles.freeShippingBar}>
                <div
                  className={styles.freeShippingProgress}
                  style={{
                    width: `${Math.min(
                      freeShippingThreshold > 0 ? (cartTotal / freeShippingThreshold) * 100 : 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              {cartTotal >= freeShippingThreshold
                ? <p className={styles.freeShippingText}>🎉 You qualify for <strong>free delivery!</strong></p>
                : <p className={styles.freeShippingText}>Add {formatPrice(freeShippingThreshold - cartTotal)} more for free delivery</p>
              }
            </div>

            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span className={styles.summaryTotal}>{formatPrice(cartTotal)}</span>
              </div>
              <p className={styles.summaryNote}>Delivery calculated at checkout</p>
            </div>

            <div className={styles.ctaGroup}>
              <Link href="/checkout" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={closeCart}>
                Proceed to Checkout <ArrowRight size={16} />
              </Link>
              <Link href="/cart" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }} onClick={closeCart}>
                View Full Cart
              </Link>
            </div>

            <div className={styles.paymentRow}>
              {['PayFast', 'Yoco', 'Payflex'].map((p) => (
                <span key={p} className={styles.payBadge}>{p}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
