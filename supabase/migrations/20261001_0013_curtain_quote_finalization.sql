-- Final quotation + payment support for curtain quote enquiries.
-- Admin reviews a customer's configuration, adjusts the final pricing, and
-- sends it to the customer by email. The email carries a payment link
-- (/quote-payment?ref=...&token=...) that loads the confirmed price from the
-- website and pays it through PayFast or Yoco.

alter table public.curtain_quotes
  add column if not exists final_line_items jsonb not null default '[]'::jsonb;
alter table public.curtain_quotes
  add column if not exists final_total numeric;
alter table public.curtain_quotes
  add column if not exists quote_message text not null default '';
alter table public.curtain_quotes
  add column if not exists payment_token text not null default '';
alter table public.curtain_quotes
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid'));
alter table public.curtain_quotes
  add column if not exists payment_provider text not null default '';
alter table public.curtain_quotes
  add column if not exists payment_reference text not null default '';
alter table public.curtain_quotes
  add column if not exists quote_sent_at timestamptz;
alter table public.curtain_quotes
  add column if not exists paid_at timestamptz;

create index if not exists curtain_quotes_payment_token_idx
  on public.curtain_quotes(reference, payment_token);
