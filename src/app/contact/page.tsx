'use client';

import { FormEvent, useState } from 'react';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { useToastFeedback } from '@/lib/toast-feedback';
import { buildWhatsAppUrl, WHATSAPP_DISPLAY_NUMBER } from '@/lib/whatsapp';

const defaultForm = {
  fullName: '',
  email: '',
  phone: '',
  message: '',
};

export default function ContactPage() {
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useToastFeedback({ error, success });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.fullName.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Full name, email, and message are required.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not submit enquiry.');
      }

      setForm(defaultForm);
      setSuccess('Enquiry sent successfully. Our team will get back to you shortly.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not submit enquiry.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        <span className="label-accent">Contact</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0 1.25rem' }}>Talk to the <span className="heading-accent">Zhua Team</span></h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1rem' }}>
          <div style={{ background: '#163250', border: '1px solid rgba(181,146,65,0.18)', borderRadius: 14, padding: '1.25rem' }}>
            <h2 className="heading-md" style={{ color: '#EAF0F8', marginBottom: '1rem' }}>Send a Message</h2>
            <form style={{ display: 'grid', gap: '0.8rem' }} onSubmit={onSubmit}>
              <input
                className="form-input"
                placeholder="Full name"
                value={form.fullName}
                onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                required
              />
              <input
                className="form-input"
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
              <input
                className="form-input"
                placeholder="Phone number"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
              <textarea
                className="form-input"
                rows={5}
                placeholder="How can we help?"
                value={form.message}
                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                required
              />
              {error ? <p style={{ margin: 0, color: '#ffd0d0' }}>{error}</p> : null}
              {success ? <p style={{ margin: 0, color: '#b6eccf' }}>{success}</p> : null}
              <button className="btn btn-primary" type="submit" style={{ justifyContent: 'center' }} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Enquiry'}
              </button>
            </form>
          </div>

          <aside style={{ display: 'grid', gap: '0.8rem' }}>
            {[
              { icon: Phone, title: 'Phone', value: WHATSAPP_DISPLAY_NUMBER },
              { icon: Mail, title: 'Email', value: 'zhuaenterprise@gmail.com' },
              { icon: MapPin, title: 'Location', value: 'Johannesburg, South Africa' },
            ].map(({ icon: Icon, title, value }) => (
              <div key={title} style={{ background: '#163250', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.3rem' }}>
                  <Icon size={14} color="#B59241" />
                  <span style={{ color: '#EAF0F8', fontWeight: 600, fontSize: '0.9rem' }}>{title}</span>
                </div>
                <p style={{ color: '#A9B7C9', fontSize: '0.9rem' }}>{value}</p>
              </div>
            ))}
            <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp" style={{ justifyContent: 'center' }}>
              <MessageCircle size={16} /> Chat on WhatsApp
            </a>
          </aside>
        </div>
      </div>
    </div>
  );
}
