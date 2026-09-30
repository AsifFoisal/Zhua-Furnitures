'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOutAdmin } from '../../app/admin/actions';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Users,
  Image,
  FileText,
  MessageCircle,
  Ruler,
  SlidersHorizontal,
  Settings,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import styles from './AdminLayout.module.css';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Boxes },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Contact Enquiries', href: '/admin/contact-enquiries', icon: MessageCircle },
  { label: 'Curtain Quotes', href: '/admin/curtain-quotes', icon: Ruler },
  { label: 'Curtain Customizer', href: '/admin/curtain-customizer', icon: SlidersHorizontal },
  { label: 'Installation Bookings', href: '/admin/installation-bookings', icon: ShoppingCart },
  { label: 'Promo Codes', href: '/admin/promo-codes', icon: Bell },
  { label: 'Vendor Applications', href: '/admin/vendor-applications', icon: Users },
  { label: 'Newsletters', href: '/admin/newsletters', icon: FileText },
  { label: 'Gallery', href: '/admin/gallery', icon: Image },
  { label: 'Testimonials', href: '/admin/testimonials', icon: MessageCircle },
  { label: 'Content', href: '/admin/content', icon: FileText },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

const titleMap: Record<string, string> = {
  '/admin': 'Admin Dashboard',
  '/admin/products': 'Product Management',
  '/admin/orders': 'Order Management',
  '/admin/customers': 'Customer Management',
  '/admin/contact-enquiries': 'Contact Enquiries',
  '/admin/curtain-quotes': 'Curtain Quote Enquiries',
  '/admin/curtain-customizer': 'Curtain Customizer Settings',
  '/admin/installation-bookings': 'Installation Bookings',
  '/admin/promo-codes': 'Promo Codes',
  '/admin/vendor-applications': 'Vendor Applications',
  '/admin/newsletters': 'Newsletter Subscriptions',
  '/admin/gallery': 'Gallery Management',
  '/admin/testimonials': 'Testimonial Management',
  '/admin/content': 'Content Management',
  '/admin/settings': 'Settings',
};

export default function AdminLayout({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const pageTitle = titleMap[pathname] ?? 'Admin';

  const today = new Intl.DateTimeFormat('en-ZA', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className={styles.adminApp}>
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.brandRow}>
          <div className={styles.brandMark}>Z</div>
          {!collapsed && (
            <div>
              <p className={styles.brandTitle}>ZHUA ADMIN</p>
              <p className={styles.brandSub}>Operations Console</p>
            </div>
          )}
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <button
          className={styles.collapseButton}
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>

      <div className={styles.mainPane}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.date}>{today}</p>
            <h1 className={styles.title}>{pageTitle}</h1>
          </div>

          <div className={styles.topbarRight}>
            <button className={styles.notifyButton} aria-label="Notifications">
              <Bell size={18} />
              <span className={styles.notifyDot} />
            </button>
            <div className={styles.adminChip}>
              <span className={styles.adminAvatar}>A</span>
              <div>
                <p className={styles.adminName}>{userEmail ?? 'Admin User'}</p>
                <p className={styles.adminRole}>Super Admin</p>
              </div>
            </div>

            <form action={signOutAdmin}>
              <button type="submit" className={styles.signOutButton}>Sign Out</button>
            </form>
          </div>
        </header>

        <section className={styles.content}>{children}</section>
      </div>
    </div>
  );
}
