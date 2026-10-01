'use client';

import { useEffect, useState } from 'react';

export interface CloudinaryImageAsset {
  publicId: string;
  secureUrl: string;
  alt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  location: string;
  project: string;
  beforeImage: CloudinaryImageAsset | null;
  afterImage: CloudinaryImageAsset | null;
}

/** Shared loader for the gallery API, used by the homepage projects section and the /projects page. */
export function useGalleryItems() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const res = await fetch('/api/gallery', { cache: 'no-store' });
        const data = (await res.json()) as { items?: GalleryItem[] };
        if (!ignore) {
          setItems(data.items ?? []);
        }
      } catch {
        if (!ignore) {
          setItems([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      ignore = true;
    };
  }, []);

  return { items, loading };
}
