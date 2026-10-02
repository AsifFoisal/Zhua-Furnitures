'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Search, Heart, Menu, X, ChevronDown, User, LogOut, MessageCircle } from 'lucide-react';
import { useCartStore, useSearchStore } from '@/store';
import { signOutUser } from '@/app/auth/actions';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { DESIGN_STUDIO_FEATURE, isCurtainCustomizerEnabled } from '@/lib/features';
import ThemeToggle from '@/components/layout/ThemeToggle';
import styles from './Navbar.module.css';

interface NavbarAuthUser {
  id: string;
  email: string | null;
}

type NavChildLink = {
  label: string;
  href: string;
  desc: string;
  disabled?: boolean;
};

type NavLink = {
  label: string;
  href: string;
  disabled?: boolean;
  children?: NavChildLink[];
};

const navLinks: NavLink[] = [
  { label: 'Furniture', href: '/furniture' },
  { label: 'Curtains & Blinds', href: '/curtains-blinds' },
  {
    label: 'Interior Design',
    href: '/interior-design',
    children: [
      { label: 'Room Visualizer', href: '/design-studio/room-visualizer', desc: 'See furniture in your room', disabled: !DESIGN_STUDIO_FEATURE.enabled },
      { label: 'Curtain Customizer', href: '/design-studio/curtain-customizer', desc: 'Design & calculate your curtains', disabled: !isCurtainCustomizerEnabled() },
    ],
  },
  {
    label: 'Wallz & Deckz',
    href: '/wallz-deckz',
    children: [
      { label: 'WALLZ — Feature Walls', href: '/wallz', desc: 'Panelling, slats & wall finishes' },
      { label: 'DECKZ — Outdoor Decking', href: '/deckz', desc: 'Decks, patios & outdoor platforms' },
      { label: 'Before & After Projects', href: '/projects', desc: 'Recent ZHUA installations' },
      { label: 'Book a Site Measurement', href: '/book-installation', desc: 'We measure, quote & install' },
    ],
  },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<NavbarAuthUser | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { itemCount, toggleCart } = useCartStore();
  const { open: openSearch } = useSearchStore();
  const count = mounted ? itemCount() : 0;
  const accountHref = authUser ? '/account' : '/auth/login';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/user', {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!res.ok) {
          if (!ignore) {
            setAuthUser(null);
          }
          return;
        }

        const data = (await res.json()) as { user?: NavbarAuthUser | null };
        if (!ignore) {
          setAuthUser(data.user ?? null);
        }
      } catch {
        if (!ignore) {
          setAuthUser(null);
        }
      } finally {
        if (!ignore) {
          setAuthResolved(true);
        }
      }
    };

    void loadUser();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  const handleMouseEnter = (label: string) => setActiveMenu(label);
  const handleMouseLeave = () => setActiveMenu(null);

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.solid : styles.transparent}`}>
        <div className={styles.inner}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <Image
              src="/logo.jpg"
              alt="Zhua Furniture"
              width={180}
              height={180}
              priority
              className={styles.logoImage}
            />
          </Link>

          {/* Desktop Nav */}
          <ul className={styles.desktopNav}>
            {navLinks.map((link) => (
              <li
                key={link.label}
                className={styles.navItem}
                onMouseEnter={() => link.children && handleMouseEnter(link.label)}
                onMouseLeave={handleMouseLeave}
              >
                {link.disabled ? (
                  <span className={`${styles.navLink} ${styles.navLinkDisabled}`} aria-disabled="true">
                    {link.label}
                    {link.children && <ChevronDown size={14} />}
                    <span className={styles.comingSoonBadge}>{DESIGN_STUDIO_FEATURE.label}</span>
                  </span>
                ) : (
                  <Link href={link.href} className={styles.navLink}>
                    {link.label}
                    {link.children && <ChevronDown size={14} />}
                  </Link>
                )}

                {link.children && activeMenu === link.label && (
                  <div className={styles.megaMenu}>
                    <div className={styles.megaMenuInner}>
                      {link.children.map((child) =>
                        child.disabled ? (
                          <div key={child.href} className={`${styles.megaMenuItem} ${styles.megaMenuItemDisabled}`} aria-disabled="true">
                            <span className={styles.megaMenuLabel}>{child.label}</span>
                            <span className={styles.megaMenuDesc}>{child.desc}</span>
                            <span className={styles.comingSoonPill}>{DESIGN_STUDIO_FEATURE.label}</span>
                          </div>
                        ) : (
                          <Link key={child.href} href={child.href} className={styles.megaMenuItem}>
                            <span className={styles.megaMenuLabel}>{child.label}</span>
                            <span className={styles.megaMenuDesc}>{child.desc}</span>
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className={styles.actions}>
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionBtn}
              aria-label="WhatsApp ZHUA"
            >
              <MessageCircle size={20} />
            </a>
            <ThemeToggle className={styles.themeBtn} />
            <button className={styles.actionBtn} onClick={openSearch} aria-label="Search">
              <Search size={20} />
            </button>
            <Link href="/account/wishlist" className={styles.actionBtn} aria-label="Wishlist">
              <Heart size={20} />
            </Link>
            <Link href={accountHref} className={styles.actionBtn} aria-label={authUser ? 'My account' : 'Sign in'}>
              <User size={20} />
            </Link>
            {authResolved && !authUser ? (
              <Link href="/auth/register" className={styles.authCta}>
                Join
              </Link>
            ) : null}
            {authResolved && authUser ? (
              <form action={signOutUser} className={styles.authForm}>
                <button className={styles.actionBtn} type="submit" aria-label="Sign out">
                  <LogOut size={18} />
                </button>
              </form>
            ) : null}
            <button className={styles.cartBtn} onClick={toggleCart} aria-label="Cart">
              <ShoppingBag size={20} />
              {mounted && count > 0 && <span className={styles.cartBadge}>{count}</span>}
            </button>
            <Link href="/contact" className={styles.quoteCta}>
              Get a Quote
            </Link>
            <button className={styles.mobileMenuBtn} onClick={() => setMobileOpen(true)} aria-label="Menu">
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)}>
          <div className={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileHeader}>
              <Link href="/" className={styles.logo}>
                <Image
                  src="/logo.jpg"
                  alt="Zhua Furniture"
                  width={160}
                  height={160}
                  className={styles.mobileLogoImage}
                />
              </Link>
              <button className={styles.mobileClose} onClick={() => setMobileOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <ul className={styles.mobileLinks}>
              {navLinks.map((link) => (
                <li key={link.label}>
                  {link.disabled ? (
                    <div className={`${styles.mobileLink} ${styles.mobileLinkDisabled}`} aria-disabled="true">
                      {link.label}
                      <span className={styles.comingSoonBadge}>{DESIGN_STUDIO_FEATURE.label}</span>
                    </div>
                  ) : (
                    <Link href={link.href} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                      {link.label}
                    </Link>
                  )}
                  {link.children && (
                    <ul className={styles.mobileSubLinks}>
                      {link.children.map((child) => (
                        <li key={child.href}>
                          {child.disabled ? (
                            <div className={`${styles.mobileSubLink} ${styles.mobileSubLinkDisabled}`} aria-disabled="true">
                              {child.label}
                              <span className={styles.comingSoonPill}>{DESIGN_STUDIO_FEATURE.label}</span>
                            </div>
                          ) : (
                            <Link href={child.href} className={styles.mobileSubLink} onClick={() => setMobileOpen(false)}>
                              {child.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <div className={styles.mobileFooter}>
              <ThemeToggle className={styles.themeMobileBtn} showLabel />
              <div className={styles.mobileAuthActions}>
                <Link href={accountHref} className="btn btn-outline btn-sm" onClick={() => setMobileOpen(false)}>
                  {authUser ? 'My Account' : 'Sign In'}
                </Link>
                {authResolved && !authUser ? (
                  <Link href="/auth/register" className="btn btn-primary btn-sm" onClick={() => setMobileOpen(false)}>
                    Register
                  </Link>
                ) : null}
                {authResolved && authUser ? (
                  <form action={signOutUser}>
                    <button type="submit" className="btn btn-outline btn-sm" onClick={() => setMobileOpen(false)}>
                      Sign Out
                    </button>
                  </form>
                ) : null}
              </div>
              <a href={buildWhatsAppUrl()} className="btn btn-whatsapp btn-sm" target="_blank" rel="noopener noreferrer">
                WhatsApp Us
              </a>
              <Link href="/contact" className="btn btn-primary btn-sm" onClick={() => setMobileOpen(false)}>Get a Quote</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
