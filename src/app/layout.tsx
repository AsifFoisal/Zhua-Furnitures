import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import ClientChrome from '@/components/layout/ClientChrome';
import AppToaster from '@/components/ui/AppToaster';
import FdProcessedIdSanitizer from '@/components/layout/FdProcessedIdSanitizer';
import { getCanonicalSiteUrl } from '@/lib/site-url';
import { THEME_STORAGE_KEY } from '@/lib/theme';

const canonicalSiteUrl = getCanonicalSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(canonicalSiteUrl),
  applicationName: 'Zhua Furniture',
  title: {
    default: 'Zhua Furniture — Premium Furniture, Curtains & Interior Design | South Africa',
    template: '%s | Zhua Furniture',
  },
  description: "South Africa's #1 home solutions platform. Shop premium furniture, custom curtains & blinds, and professional interior design services. Delivered across all 9 provinces.",
  keywords: ['furniture South Africa', 'curtains', 'blinds', 'interior design', 'home decor', 'Johannesburg furniture', 'Cape Town curtains'],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico?v=20260415', sizes: 'any' },
      { url: '/icon.png?v=20260415', type: 'image/png' },
    ],
    shortcut: [{ url: '/icon.png?v=20260415', type: 'image/png' }],
    apple: [{ url: '/apple-icon.png?v=20260415', type: 'image/png' }],
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: 'Zhua Furniture — Premium Furniture, Curtains & Interior Design',
    description: "South Africa's #1 home solutions platform. Premium furniture, custom curtains, and expert interior design.",
    type: 'website',
    locale: 'en_ZA',
    url: '/',
    siteName: 'Zhua Furniture',
    images: [
      {
        url: '/logo.jpg',
        width: 1024,
        height: 1024,
        alt: 'Zhua Furniture logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zhua Furniture — Premium Furniture, Curtains & Interior Design',
    description: "South Africa's #1 home solutions platform. Premium furniture, custom curtains, and expert interior design.",
    images: ['/logo.jpg'],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_STORAGE_KEY)?.value;
  const themeMode = themeCookie === 'light' ? 'light' : 'dark';

  return (
    <html lang="en-ZA" data-theme={themeMode} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <FdProcessedIdSanitizer />
        <AppToaster />
        <ClientChrome>{children}</ClientChrome>
      </body>
    </html>
  );
}