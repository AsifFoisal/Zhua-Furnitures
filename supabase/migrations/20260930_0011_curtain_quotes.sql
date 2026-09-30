-- Curtain Customizer quote enquiries.
-- Customers configure curtains, see an estimated price, and submit an enquiry.
-- No payment is captured here: ZHUA reviews the configuration, confirms the
-- final measurements/quotation, and only then issues a payment request.

create table if not exists public.curtain_quotes (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text not null default '',
  city text not null default '',
  notes text not null default '',
  configuration jsonb not null default '{}'::jsonb,
  estimated_total numeric not null default 0,
  status text not null default 'new' check (status in ('new', 'reviewing', 'quoted', 'won', 'lost', 'archived')),
  admin_notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists curtain_quotes_status_created_idx
  on public.curtain_quotes(status, created_at desc);

create index if not exists curtain_quotes_email_idx
  on public.curtain_quotes(email);

drop trigger if exists curtain_quotes_set_updated_at on public.curtain_quotes;
create trigger curtain_quotes_set_updated_at
before update on public.curtain_quotes
for each row
execute function public.set_updated_at();

alter table public.curtain_quotes enable row level security;

create policy "curtain_quotes_insert_anon"
on public.curtain_quotes
for insert
to anon
with check (user_id is null);

create policy "curtain_quotes_insert_authenticated"
on public.curtain_quotes
for insert
to authenticated
with check (user_id is null or user_id = auth.uid());

create policy "curtain_quotes_select_own_or_admin"
on public.curtain_quotes
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "curtain_quotes_update_admin"
on public.curtain_quotes
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
