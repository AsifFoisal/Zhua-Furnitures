'use client';

import { Suspense, FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, Phone, MapPin, MessageCircle, Sparkles, X } from 'lucide-react';
import { useToastFeedback } from '@/lib/toast-feedback';
import { buildWhatsAppUrl, WHATSAPP_DISPLAY_NUMBER } from '@/lib/whatsapp';

const defaultForm = {
  fullName: '',
  email: '',
  phone: '',
  message: '',
};

/** Builds the pre-filled message for catalog "Customize & Request a Quote" links. */
function buildQuoteMessage(params: URLSearchParams): string {
  const item = params.get('item');
  if (!item) return defaultForm.message;

  const division = params.get('division');
  const category = params.get('category');
  const kind = params.get('kind');
  const finish = params.get('finish');

  const parts = [
    `I'd like to customize the "${item}"`,
    category ? `(${category})` : '',
    division ? `from your ${division} range` : '',
    kind ? `— ${kind}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return [
    `Hi ZHUA! ${parts}.`,
    finish ? `Preferred finish: ${finish}.` : '',
    'Please help me with a quote for my space — happy to arrange a site measurement.',
  ]
    .filter(Boolean)
    .join(' ');
}

function ContactForm() {
  const searchParams = useSearchParams();
  const hasQuoteContext = Boolean(searchParams.get('item'));
  const quoteItem = searchParams.get('item');
  const quoteCategory = searchParams.get('category');
  const quoteDivision = searchParams.get('division');

  const [form, setForm] = useState(() => ({
    ...defaultForm,
    message: buildQuoteMessage(searchParams),
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useToastFeedback({ error, success });

  const clearQuoteContext = () => {
    window.location.replace('/contact');
    setForm((prev) => ({ ...prev, message: defaultForm.message }));
  };

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
    <div style={{ background: 'var(--charcoal)', border: '1px solid rgba(181,146,65,0.18)', borderRadius: 14, padding: '1.25rem' }}>
      <h2 className="heading-md" style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Send a Message</h2>

      {hasQuoteContext && quoteItem ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
            padding: '0.8rem 1rem',
            marginBottom: '1rem',
            borderRadius: 10,
            border: '1px dashed var(--border)',
            background: 'rgba(181,146,65,0.08)',
          }}
        >
          <Sparkles size={15} color="var(--gold)" style={{ marginTop: 3, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Customize &amp; quote request
            </p>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
              {quoteItem}
              {quoteCategory ? <span style={{ color: 'var(--text-muted)' }}> · {quoteCategory}</span> : null}
              {quoteDivision ? <span style={{ color: 'var(--text-muted)' }}> · {quoteDivision}</span> : null}
            </p>
          </div>
          <button
            type="button"
            onClick={clearQuoteContext}
            aria-label="Clear quote pre-fill"
            style={{ color: 'var(--text-muted)', flexShrink: 0 }}
          >
            <X size={15} />
          </button>
        </div>
      ) : null}

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
        {error ? <p style={{ margin: 0, color: 'var(--status-danger)' }}>{error}</p> : null}
        {success ? <p style={{ margin: 0, color: '#b6eccf' }}>{success}</p> : null}
        <button className="btn btn-primary" type="submit" style={{ justifyContent: 'center' }} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Enquiry'}
        </button>
      </form>
    </div>
  );
}

function ContactFormFallback() {
  return (
    <div
      style={{
        background: 'var(--charcoal)',
        border: '1px solid rgba(181,146,65,0.18)',
        borderRadius: 14,
        padding: '1.25rem',
        minHeight: 420,
      }}
      aria-hidden="true"
    />
  );
}

export default function ContactPage() {
  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        <span className="label-accent">Contact</span>
        <h1 className="heading-xl" style={{ color: 'var(--text-primary)', margin: '1rem 0 1.25rem' }}>Talk to the <span className="heading-accent">Zhua Team</span></h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1rem' }}>
          <Suspense fallback={<ContactFormFallback />}>
            <ContactForm />
          </Suspense>

          <aside style={{ display: 'grid', gap: '0.8rem', alignContent: 'start' }}>
            {[
              { icon: Phone, title: 'Phone', value: WHATSAPP_DISPLAY_NUMBER },
              { icon: Mail, title: 'Email', value: 'zhuaenterprise@gmail.com' },
              { icon: MapPin, title: 'Location', value: 'Johannesburg, South Africa' },
            ].map(({ icon: Icon, title, value }) => (
              <div key={title} style={{ background: 'var(--charcoal)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.3rem' }}>
                  <Icon size={14} color="var(--gold)" />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{title}</span>
                </div>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{value}</p>
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
