'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { describeResponseFailure, readResponseJson } from '@/lib/http';

type InitiateResponse = {
  formAction?: string;
  fields?: Record<string, string>;
  error?: string;
};

export default function OrderPaymentActions({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: string;
}) {
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    setPaying(true);

    try {
      const res = await fetch('/api/payments/payfast/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await readResponseJson<InitiateResponse>(res);
      if (!res.ok) {
        throw new Error(data?.error ?? describeResponseFailure(res));
      }

      const formAction = data?.formAction;
      const fields = data?.fields;

      if (!formAction || !fields) {
        throw new Error('Could not start the payment.');
      }

      toast.info('Redirecting to PayFast...');
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = formAction;

      for (const [key, value] of Object.entries(fields)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start the payment.');
      setPaying(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <button
        type="button"
        className="btn btn-primary btn-lg"
        style={{ justifyContent: 'center' }}
        disabled={paying}
        onClick={() => void handlePay()}
      >
        <Lock size={15} /> {paying ? 'Redirecting...' : 'Pay with PayFast'}
      </button>
      <p style={{ color: 'var(--text-faint)', fontSize: '0.75rem', margin: 0, textAlign: 'center' }}>
        Reference {orderNumber} · Secured checkout
      </p>
    </div>
  );
}
