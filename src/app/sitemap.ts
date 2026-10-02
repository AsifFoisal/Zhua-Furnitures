import type { MetadataRoute } from 'next';
import { getCanonicalSiteUrl } from '@/lib/site-url';

const canonicalSiteUrl = getCanonicalSiteUrl();

const publicPaths = [
  '/',
  '/about',
  '/shop',
  '/gallery',
  '/furniture',
  '/curtains-blinds',
  '/interior-design',
  '/wallz-deckz',
  '/wallz',
  '/deckz',
  '/projects',
  '/design-studio',
  '/book-installation',
  '/contact',
  '/track-order',
  '/marketplace',
  '/policies',
  '/reviews',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicPaths.map((path, index) => ({
    url: `${canonicalSiteUrl}${path}`,
    lastModified: now,
    changeFrequency: index === 0 ? 'daily' : 'weekly',
    priority: index === 0 ? 1 : 0.7,
  }));
}