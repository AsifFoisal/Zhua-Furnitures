'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/store';

/**
 * Clears the shopping cart only once the customer is back from the payment
 * gateway. Keeping the cart in the checkout page means a failed gateway page
 * does not wipe the basket before the order round-trip completes.
 */
export default function ClearCartOnConfirmation({ enabled }: { enabled: boolean }) {
  const hydrated = useCartStore((state) => state.hydrated);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    if (!enabled || !hydrated) {
      return;
    }

    clearCart();
  }, [clearCart, enabled, hydrated]);

  return null;
}
