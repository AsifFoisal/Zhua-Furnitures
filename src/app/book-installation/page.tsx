'use client';
import { FormEvent, useState } from 'react';
import { products } from '@/lib/data';
import { useToastFeedback } from '@/lib/toast-feedback';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

const slots = ['08:00 - 10:00', '10:00 - 12:00', '13:00 - 15:00', '15:00 - 17:00'];

const defaultBookingForm = {
  productId: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  address: '',
  preferredDate: '',
  preferredSlot: '',
  notes: '',
};

export default function BookInstallationPage() {
  const [form, setForm] = useState(defaultBookingForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useToastFeedback({ error, success });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (
      !form.productId ||
      !form.customerName.trim() ||
      !form.customerEmail.trim() ||
      !form.customerPhone.trim() ||
      !form.address.trim() ||
      !form.preferredDate ||
      !form.preferredSlot
    ) {
      setError('Please complete all required booking details.');
      return;
    }

    const selectedProduct = products.find((product) => product.id === form.productId);
    if (!selectedProduct) {
      setError('Please select a valid product.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/book-installation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          productName: selectedProduct.name,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not submit booking.');
      }

      setSuccess('Installation booking submitted successfully.');
      setSubmitted(true);
      setForm(defaultBookingForm);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not submit booking.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: '150px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
        <div className="container" style={{ maxWidth: '700px', textAlign: 'center' }}>
          <span className="label-accent">Booking Confirmed</span>
          <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0' }}>Installation Request Received</h1>
          <p style={{ color: '#A9B7C9', lineHeight: 1.8, marginBottom: '1.2rem' }}>Our scheduling team will confirm your installation slot via WhatsApp and email.</p>
          <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">Confirm on WhatsApp</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        <span className="label-accent">Book Installation</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0 1.25rem' }}>Schedule <span className="heading-accent">Professional Installation</span></h1>

        <form onSubmit={onSubmit} style={{ background: '#163250', border: '1px solid rgba(181,146,65,0.2)', borderRadius: 14, padding: '1.2rem', display: 'grid', gap: '0.8rem' }}>
          <div className="form-group">
            <label className="form-label">Product</label>
            <select
              className="form-select"
              required
              value={form.productId}
              onChange={(event) => setForm((prev) => ({ ...prev, productId: event.target.value }))}
            >
              <option value="">Select product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gap: '0.7rem', gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                placeholder="Your full name"
                required
                value={form.customerName}
                onChange={(event) => setForm((prev) => ({ ...prev, customerName: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className="form-input"
                placeholder="+27 000 000 0000"
                required
                value={form.customerPhone}
                onChange={(event) => setForm((prev) => ({ ...prev, customerPhone: event.target.value }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              required
              value={form.customerEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, customerEmail: event.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              className="form-input"
              placeholder="Street address"
              required
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            />
          </div>
          <div style={{ display: 'grid', gap: '0.7rem', gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">Preferred Date</label>
              <input
                type="date"
                className="form-input"
                required
                value={form.preferredDate}
                onChange={(event) => setForm((prev) => ({ ...prev, preferredDate: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Time Slot</label>
              <select
                className="form-select"
                required
                value={form.preferredSlot}
                onChange={(event) => setForm((prev) => ({ ...prev, preferredSlot: event.target.value }))}
              >
                <option value="">Select slot</option>
                {slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Any access instructions or additional context"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </div>
          {error ? <p style={{ margin: 0, color: '#ffd0d0' }}>{error}</p> : null}
          <button className="btn btn-primary" type="submit" style={{ justifyContent: 'center' }} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
