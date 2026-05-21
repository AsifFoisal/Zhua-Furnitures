'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import SearchModal from '@/components/layout/SearchModal';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import WishlistSync from '@/components/layout/WishlistSync';
import CartSync from '@/components/layout/CartSync';
import ScrollRevealManager from '@/components/layout/ScrollRevealManager';

export default function ClientChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const normalized = (pathname ?? '').toLowerCase();
  const isAdminRoute = /^\/(?:[a-z]{2}(?:-[a-z]{2})\/)?admin(?:\/|$)/.test(normalized);

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <CartSync />
      <WishlistSync />
      <main className="page-content">{children}</main>
      <Footer />
      <CartDrawer />
      <SearchModal />
      <WhatsAppFloat />
      <ScrollRevealManager />
    </>
  );
}
