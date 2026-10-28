'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';

export default function MarketplacePage() {
  const [form, setForm] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    category: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const submitWaitlist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.businessName.trim() || !form.contactName.trim() || !form.email.trim()) {
      toast.error('Business name, contact name, and email are required.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/marketplace/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not join waitlist right now.');
      }

      setForm({
        businessName: '',
        contactName: '',
        email: '',
        phone: '',
        website: '',
        category: '',
        message: '',
      });
      toast.success('You are on the vendor waitlist. We will contact you soon.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not join waitlist right now.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '150px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '720px', textAlign: 'center' }}>
        <span className="label-accent">Marketplace</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0' }}>Vendor Portal <span className="heading-accent">Coming Soon</span></h1>
        <p style={{ color: '#A9B7C9', lineHeight: 1.8, marginBottom: '1.5rem' }}>
          We are preparing a curated marketplace where verified South African makers and decor studios can list premium products on Zhua.
        </p>
        <form
          onSubmit={submitWaitlist}
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            textAlign: 'left',
            background: '#163250',
            border: '1px solid rgba(181,146,65,0.2)',
            borderRadius: 14,
            padding: '1rem',
            display: 'grid',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'grid', gap: '0.7rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <input
              className="form-input"
              placeholder="Business name"
              value={form.businessName}
              onChange={(event) => setForm((prev) => ({ ...prev, businessName: event.target.value }))}
              required
            />
            <input
              className="form-input"
              placeholder="Contact name"
              value={form.contactName}
              onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))}
              required
            />
            <input
              className="form-input"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <input
              className="form-input"
              placeholder="Phone"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
            <input
              className="form-input"
              placeholder="Website (optional)"
              value={form.website}
              onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))}
            />
            <input
              className="form-input"
              placeholder="Category (e.g. Furniture, Decor)"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            />
          </div>
          <textarea
            className="form-input"
            rows={4}
            placeholder="Tell us about your brand"
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
          />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Join Waitlist'}
            </button>
            <Link href="/contact" className="btn btn-primary">Contact Team</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
