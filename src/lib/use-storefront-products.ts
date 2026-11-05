'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@/lib/data';

interface ProductsResponse {
  products?: Product[];
  error?: string;
}

export function useStorefrontProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch('/api/products', { cache: 'no-store' });
        if (!res.ok) {
          return;
        }

        const data = (await res.json()) as ProductsResponse;
        if (Array.isArray(data.products)) {
          setProducts(data.products);
        }
      } catch {
        // Keep the empty catalogue — callers render skeleton while loading
        // and an empty state afterwards. No mock fallback products.
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, []);

  return { products, loading };
}
