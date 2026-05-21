'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { MessageCircle, Heart, Star, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { buildWhatsAppUrl, WHATSAPP_DISPLAY_NUMBER, WHATSAPP_TEL } from '@/lib/whatsapp';
import { DESIGN_STUDIO_FEATURE } from '@/lib/features';
import styles from './Footer.module.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isDesignStudioDisabled = !DESIGN_STUDIO_FEATURE.enabled;

  const submitNewsletter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error('Enter your email to subscribe.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
      });

      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not subscribe right now.');
      }

      setEmail('');
      toast.success(data.message ?? 'Subscribed successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not subscribe right now.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className={styles.footer}>
      {/* Newsletter Band */}
      <div className={styles.newsletter}>
        <div className="container">
          <div className={styles.newsletterInner}>
            <div>
              <p className="label-accent">Stay Inspired</p>
              <h3 className={styles.newsletterTitle}>Design Ideas, Exclusive Offers & New Arrivals</h3>
            </div>
            <form className={styles.newsletterForm} onSubmit={submitNewsletter}>
              <input
                type="email"
                placeholder="Your email address"
                className={styles.newsletterInput}
                aria-label="Email address for newsletter"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Subscribing...' : 'Subscribe'} <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className={styles.main}>
        <div className="container">
          <div className={styles.grid}>
            {/* Brand */}
            <div className={styles.brand}>
              <Link href="/" className={styles.logo}>
                <Image
                  src="/logo.jpg"
                  alt="Zhua Furniture"
                  width={220}
                  height={220}
                  className={styles.logoImage}
                />
              </Link>
              <p className={styles.brandDesc}>
                Premium furniture, curtains & blinds, and interior design services — delivered across all 9 South African provinces.
              </p>
              <div className={styles.socials}>
                <a
                  href={buildWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialBtn}
                  aria-label="WhatsApp"
                >
                  <MessageCircle size={18} />
                </a>
                <a href="#" className={styles.socialBtn} aria-label="Favourites"><Heart size={18} /></a>
                <a href="#" className={styles.socialBtn} aria-label="Reviews"><Star size={18} /></a>
              </div>
            </div>

            {/* Shop */}
            <div>
              <h4 className={styles.colTitle}>Shop</h4>
              <ul className={styles.linkList}>
                <li><Link href="/shop/furniture" className={styles.footerLink}>Furniture</Link></li>
                <li><Link href="/shop/curtains" className={styles.footerLink}>Curtains & Blinds</Link></li>
                <li><Link href="/shop/accessories" className={styles.footerLink}>Accessories</Link></li>
                <li><Link href="/shop?badge=new" className={styles.footerLink}>New Arrivals</Link></li>
                <li><Link href="/shop?badge=sale" className={styles.footerLink}>Sale</Link></li>
              </ul>
            </div>

            {/* Design Studio */}
            <div>
              <h4 className={styles.colTitle}>Design Studio</h4>
              <ul className={styles.linkList}>
                <li>
                  {isDesignStudioDisabled ? (
                    <span className={`${styles.footerLink} ${styles.footerLinkDisabled}`} aria-disabled="true">
                      Room Visualizer
                      <span className={styles.comingSoonNote}>{DESIGN_STUDIO_FEATURE.label}</span>
                    </span>
                  ) : (
                    <Link href="/design-studio/room-visualizer" className={styles.footerLink}>Room Visualizer</Link>
                  )}
                </li>
                <li>
                  {isDesignStudioDisabled ? (
                    <span className={`${styles.footerLink} ${styles.footerLinkDisabled}`} aria-disabled="true">
                      Curtain Customizer
                      <span className={styles.comingSoonNote}>{DESIGN_STUDIO_FEATURE.label}</span>
                    </span>
                  ) : (
                    <Link href="/design-studio/curtain-customizer" className={styles.footerLink}>Curtain Customizer</Link>
                  )}
                </li>
                <li>
                  {isDesignStudioDisabled ? (
                    <span className={`${styles.footerLink} ${styles.footerLinkDisabled}`} aria-disabled="true">
                      Curtain Calculator
                      <span className={styles.comingSoonNote}>{DESIGN_STUDIO_FEATURE.label}</span>
                    </span>
                  ) : (
                    <Link href="/design-studio/calculator" className={styles.footerLink}>Curtain Calculator</Link>
                  )}
                </li>
                <li><Link href="/book-installation" className={styles.footerLink}>Book Installation</Link></li>
                <li><Link href="/gallery" className={styles.footerLink}>Gallery</Link></li>
              </ul>
            </div>

            {/* Help & Contact */}
            <div>
              <h4 className={styles.colTitle}>Help & Contact</h4>
              <ul className={styles.linkList}>
                <li><Link href="/track-order" className={styles.footerLink}>Track Your Order</Link></li>
                <li><Link href="/policies" className={styles.footerLink}>Delivery Policy</Link></li>
                <li><Link href="/policies" className={styles.footerLink}>Returns & Refunds</Link></li>
                <li><Link href="/policies" className={styles.footerLink}>Privacy Policy</Link></li>
                <li><Link href="/contact" className={styles.footerLink}>Contact Us</Link></li>
              </ul>
              <div className={styles.contactInfo}>
                <a href={`tel:${WHATSAPP_TEL}`} className={styles.contactItem}>
                  <Phone size={14} /> {WHATSAPP_DISPLAY_NUMBER}
                </a>
                <a href="mailto:zhuaenterprise@gmail.com" className={styles.contactItem}>
                  <Mail size={14} /> zhuaenterprise@gmail.com
                </a>
                <span className={styles.contactItem}>
                  <MapPin size={14} /> Johannesburg, South Africa
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottom}>
        <div className="container">
          <div className={styles.bottomInner}>
            <p className={styles.copyright}>
              &copy; {new Date().getFullYear()} Zhua Furniture. All rights reserved.
            </p>
            <div className={styles.paymentBadges}>
              {['PayFast', 'Yoco', 'Payflex', 'Visa', 'Mastercard'].map((p) => (
                <span key={p} className={styles.payBadge}>{p}</span>
              ))}
            </div>
            <p className={styles.madeIn}>🇿🇦 Proudly South African</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
