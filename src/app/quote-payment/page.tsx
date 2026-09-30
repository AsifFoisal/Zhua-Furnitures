import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasServiceSupabaseEnv } from '@/lib/supabase/env';
import { formatPrice } from '@/lib/data';
import QuotePaymentActions from './actions';

export const dynamic = 'force-dynamic';

type FinalQuoteLine = { label: string; amount: number };

type SearchParams = {
  ref?: string;
  token?: string;
  payment?: string;
};

const pageStyle = { padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' } as const;
const cardStyle = {
  background: '#163250',
  border: '1px solid rgba(181,146,65,0.25)',
  borderRadius: 16,
  padding: '2rem',
  display: 'grid',
  gap: '1rem',
} as const;

function parseFinalLineItems(value: unknown): FinalQuoteLine[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as { label?: unknown; amount?: unknown };
      const label = String(record.label ?? '').trim();
      const amount = Number(record.amount);
      if (!label || !Number.isFinite(amount) || amount < 0) return null;
      return { label, amount: Math.round(amount) };
    })
    .filter((item): item is FinalQuoteLine => item !== null);
}

function Notice({ title, message, showHomeCta = true }: { title: string; message: string; showHomeCta?: boolean }) {
  return (
    <div style={cardStyle}>
      <h1 className="heading-md" style={{ color: '#EAF0F8', margin: 0 }}>{title}</h1>
      <p style={{ color: '#A9B7C9', lineHeight: 1.7, margin: 0 }}>{message}</p>
      {showHomeCta ? (
        <Link href="/" className="btn btn-outline" style={{ justifyContent: 'center' }}>
          Back to Zhua Furnitures
        </Link>
      ) : null}
    </div>
  );
}

export default async function QuotePaymentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { ref, token, payment } = await searchParams;

  return (
    <div style={pageStyle}>
      <div className="container" style={{ maxWidth: 720 }}>
        <span className="label-accent">Curtain Quote Payment</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0 1.5rem' }}>Pay Your Quotation</h1>

        {!hasServiceSupabaseEnv || !ref || !token ? (
          <Notice
            title="Payment link not found"
            message="This payment link is incomplete. Please use the link from your quotation email, or contact us and we will resend it."
          />
        ) : (
          <QuotePaymentBody reference={ref} token={token} paymentStatus={payment} />
        )}
      </div>
    </div>
  );
}

async function QuotePaymentBody({
  reference,
  token,
  paymentStatus,
}: {
  reference: string;
  token: string;
  paymentStatus?: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data: quote, error } = await supabase
    .from('curtain_quotes')
    .select('reference, full_name, email, city, final_total, final_line_items, quote_message, payment_status, status, payment_provider, payment_reference, paid_at')
    .eq('reference', reference)
    .eq('payment_token', token)
    .maybeSingle();

  if (error || !quote) {
    return (
      <Notice
        title="Payment link not found"
        message="We could not find a quotation for this link. Please double-check the link from your email, or contact us and we will resend it."
      />
    );
  }

  const finalTotal = Math.round(Number(quote.final_total ?? 0));

  if (quote.payment_status === 'paid') {
    return (
      <div style={{ ...cardStyle, borderColor: 'rgba(63,191,127,0.4)' }}>
        <h2 className="heading-md" style={{ color: '#3fbf7f', margin: 0 }}>
          Payment received — thank you!
        </h2>
        <p style={{ color: '#A9B7C9', lineHeight: 1.7, margin: 0 }}>
          We have confirmed payment of <strong style={{ color: '#EAF0F8' }}>{formatPrice(finalTotal)}</strong> for
          quotation <strong style={{ color: '#EAF0F8' }}>{quote.reference}</strong>. Your curtains are going into
          production, and we will be in touch to schedule delivery and installation.
        </p>
        {quote.payment_provider ? (
          <p style={{ color: '#8ca0b8', fontSize: '0.85rem', margin: 0 }}>
            Paid via {quote.payment_provider.toUpperCase()}
            {quote.paid_at ? ` on ${new Date(quote.paid_at).toLocaleDateString('en-ZA')}` : ''}.
          </p>
        ) : null}
        <Link href="/" className="btn btn-primary" style={{ justifyContent: 'center' }}>
          Back to Zhua Furnitures
        </Link>
      </div>
    );
  }

  if (quote.status !== 'quoted' || !Number.isFinite(finalTotal) || finalTotal <= 0) {
    return (
      <Notice
        title="Your quotation is being prepared"
        message={`We have received your curtain enquiry (${quote.reference}) and are preparing your final quotation. You will receive an email with the confirmed price and a payment link once it is ready.`}
      />
    );
  }

  const lines = parseFinalLineItems(quote.final_line_items);

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {paymentStatus === 'cancelled' ? (
        <p style={{ color: '#ffd0d0', margin: 0 }}>Payment was cancelled — nothing has been charged. You can try again below.</p>
      ) : null}
      {paymentStatus === 'success' ? (
        <p style={{ color: '#a9d9bd', margin: 0 }}>
          Thank you! Your payment is being confirmed — this page will show a receipt once our gateway confirms it.
          If you returned here after paying, there is nothing more to do.
        </p>
      ) : null}

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 className="heading-md" style={{ color: '#EAF0F8', margin: 0 }}>Quotation {quote.reference}</h2>
          <span style={{ color: '#8ca0b8', fontSize: '0.85rem' }}>
            Prepared for {quote.full_name}
            {quote.city ? ` · ${quote.city}` : ''}
          </span>
        </div>

        <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
          {lines.length > 0 ? (
            lines.map((line) => (
              <div key={line.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: '#A9B7C9', fontSize: '0.92rem' }}>
                <span>{line.label}</span>
                <span style={{ color: '#EAF0F8' }}>{formatPrice(line.amount)}</span>
              </div>
            ))
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: '#A9B7C9', fontSize: '0.92rem' }}>
              <span>Confirmed quotation</span>
              <span style={{ color: '#EAF0F8' }}>{formatPrice(finalTotal)}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '0.6rem',
              fontWeight: 700,
              color: '#B59241',
              fontSize: '1.05rem',
            }}
          >
            <span>Total due</span>
            <span>{formatPrice(finalTotal)}</span>
          </div>
        </div>

        {quote.quote_message ? (
          <p style={{ color: '#A9B7C9', fontSize: '0.9rem', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>
            {quote.quote_message}
          </p>
        ) : null}

        <p style={{ color: '#8ca0b8', fontSize: '0.8rem', margin: 0 }}>
          Payments are processed securely through our website (PayFast or Yoco). Production of your curtains
          starts as soon as your payment is confirmed.
        </p>
      </div>

      <QuotePaymentActions reference={quote.reference} token={token} />
    </div>
  );
}
