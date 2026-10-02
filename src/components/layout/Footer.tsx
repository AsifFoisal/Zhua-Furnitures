'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { MessageCircle, Heart, Star, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { buildWhatsAppUrl, WHATSAPP_DISPLAY_NUMBER, WHATSAPP_TEL } from '@/lib/whatsapp';
import styles from './Footer.module.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
                Complete spaces, made for you. ZHUA designs, makes and installs custom furniture,
                curtains &amp; blinds, interior design, WALLZ wall finishes and DECKZ outdoor spaces.
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

            {/* Explore */}
            <div>
              <h4 className={styles.colTitle}>Explore</h4>
              <ul className={styles.linkList}>
                <li><Link href="/furniture" className={styles.footerLink}>Furniture</Link></li>
                <li><Link href="/curtains-blinds" className={styles.footerLink}>Curtains &amp; Blinds</Link></li>
                <li><Link href="/interior-design" className={styles.footerLink}>Interior Design</Link></li>
                <li><Link href="/wallz-deckz" className={styles.footerLink}>Wallz &amp; Deckz</Link></li>
                <li><Link href="/design-studio" className={styles.footerLink}>Design Studio</Link></li>
                <li><Link href="/projects" className={styles.footerLink}>Projects</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className={styles.colTitle}>Company</h4>
              <ul className={styles.linkList}>
                <li><Link href="/about" className={styles.footerLink}>About ZHUA</Link></li>
                <li><Link href="/contact" className={styles.footerLink}>Contact</Link></li>
                <li><Link href="/contact" className={styles.footerLink}>Visit Our Factory</Link></li>
                <li><Link href="/gallery" className={styles.footerLink}>Gallery</Link></li>
                <li><Link href="/track-order" className={styles.footerLink}>Track Your Order</Link></li>
                <li><Link href="/policies" className={styles.footerLink}>Policies</Link></li>
              </ul>
            </div>

            {/* Services + Contact */}
            <div>
              <h4 className={styles.colTitle}>Services</h4>
              <ul className={styles.linkList}>
                <li><Link href="/furniture" className={styles.footerLink}>Custom Furniture</Link></li>
                <li><Link href="/curtains-blinds" className={styles.footerLink}>Curtains &amp; Blinds</Link></li>
                <li><Link href="/interior-design" className={styles.footerLink}>Interior Design</Link></li>
                <li><Link href="/wallz" className={styles.footerLink}>Wall Solutions</Link></li>
                <li><Link href="/deckz" className={styles.footerLink}>Outdoor Spaces</Link></li>
                <li><Link href="/book-installation" className={styles.footerLink}>Book Site Measurement</Link></li>
                <li><Link href="/contact" className={styles.footerLink}>Custom Design</Link></li>
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
