'use client';

import { useState } from 'react';
import { CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';

type InitiateResponse = {
  formAction?: string;
  fields?: Record<string, string>;
  redirectUrl?: string;
  error?: string;
};

export default function QuotePaymentActions({
  reference,
  token,
}: {
  reference: string;
  token: string;
}) {
  const [paying, setPaying] = useState<'payfast' | 'yoco' | null>(null);

  const handlePay = async (provider: 'payfast' | 'yoco') => {
    setPaying(provider);

    try {
      const res = await fetch('/api/payments/quote/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, token, provider }),
      });

      const data = (await res.json()) as InitiateResponse;
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not start the payment.');
      }

      if (provider === 'payfast' && data.formAction && data.fields) {
        toast.info('Redirecting to PayFast...');
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.formAction;

        for (const [key, value] of Object.entries(data.fields)) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
        return;
      }

      if (provider === 'yoco' && data.redirectUrl) {
        toast.info('Redirecting to Yoco...');
        window.location.href = data.redirectUrl;
        return;
      }

      throw new Error('Could not start the payment.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start the payment.');
      setPaying(null);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1, justifyContent: 'center' }}
          disabled={paying !== null}
          onClick={() => void handlePay('payfast')}
        >
          <Lock size={15} /> {paying === 'payfast' ? 'Redirecting...' : 'Pay with PayFast'}
        </button>
        <button
          type="button"
          className="btn btn-outline"
          style={{ flex: 1, justifyContent: 'center' }}
          disabled={paying !== null}
          onClick={() => void handlePay('yoco')}
        >
          <CreditCard size={15} /> {paying === 'yoco' ? 'Redirecting...' : 'Pay with Yoco'}
        </button>
      </div>
      <p style={{ color: '#8ca0b8', fontSize: '0.75rem', margin: 0, textAlign: 'center' }}>
        Reference {reference} · Secured checkout
      </p>
    </div>
  );
}
