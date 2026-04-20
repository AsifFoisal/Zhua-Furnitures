'use client';
import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Truck, Star, Leaf } from 'lucide-react';
import { formatPrice } from '@/lib/data';
import { DEFAULT_FREE_SHIPPING_THRESHOLD } from '@/lib/delivery';
import styles from './TrustBar.module.css';

export default function TrustBar() {
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(DEFAULT_FREE_SHIPPING_THRESHOLD);

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

  const items = useMemo(
    () => [
      { icon: ShieldCheck, text: 'Secure checkout - SSL encrypted' },
      { icon: Star, text: '4.9★ Average customer rating' },
      { icon: Leaf, text: 'Proudly South African' },
    ],
    [freeShippingThreshold]
  );

  return (
    <div className={styles.bar}>
      <div className="container-wide">
        <div className={styles.inner}>
          {items.map(({ icon: Icon, text }) => (
            <div key={text} className={styles.item}>
              <Icon size={16} className={styles.icon} />
              <span className={styles.text}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
