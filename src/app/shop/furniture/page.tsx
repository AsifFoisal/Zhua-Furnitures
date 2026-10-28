import { permanentRedirect } from 'next/navigation';

/**
 * The furniture collection now lives on the main /furniture route.
 * Keep this path working for bookmarks and older links.
 */
export default function FurnitureShopPage() {
  permanentRedirect('/furniture#collection');
}
