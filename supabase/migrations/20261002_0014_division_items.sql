-- Division items: DB-driven content for the WALLZ and DECKZ landing pages.
-- Managed by admins via /admin/divisions; rendered on /wallz and /deckz.

create table if not exists public.division_items (
  id uuid primary key default gen_random_uuid(),
  division text not null check (division in ('wallz', 'deckz')),
  title text not null,
  description text not null default '',
  category text not null default '',
  image jsonb,
  status text not null default 'draft' check (status in ('published', 'draft')),
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists division_items_division_status_order_idx
  on public.division_items(division, status, display_order, created_at desc);

create trigger division_items_set_updated_at
before update on public.division_items
for each row
execute function public.set_updated_at();

alter table public.division_items enable row level security;

create policy "division_items_public_read_published"
on public.division_items
for select
using (status = 'published');

create policy "division_items_admin_write"
on public.division_items
for all
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

-- Demo data: inserted once per division so the landing pages have content
-- immediately. Admins can edit or delete these rows from /admin/divisions.
do $$
begin
  if not exists (select 1 from public.division_items where division = 'wallz') then
    insert into public.division_items (division, title, description, category, status, display_order) values
      ('wallz', 'Sandton Lounge Slat Wall', 'Warm timber-look slat panelling behind a custom ZHUA media unit.', 'Slat walls', 'published', 1),
      ('wallz', 'Bryanston TV Feature Wall', 'Full-height feature wall with an integrated TV niche and concealed lighting.', 'TV feature walls', 'published', 2),
      ('wallz', 'Fourways Headboard Wall', 'Panelled headboard wall framing a custom ZHUA bed.', 'Headboard walls', 'published', 3),
      ('wallz', 'Umhlanga Dining Accent Wall', 'Fluted decorative panels that anchor the dining area.', 'Accent walls', 'published', 4),
      ('wallz', 'Rosebank Office Reception Wall', 'Commercial wall installation for a reception welcome area.', 'Commercial installations', 'published', 5),
      ('wallz', 'Midrand Restaurant Cladding', 'Durable wood-look cladding for a hospitality space.', 'Wood-look cladding', 'published', 6);
  end if;

  if not exists (select 1 from public.division_items where division = 'deckz') then
    insert into public.division_items (division, title, description, category, status, display_order) values
      ('deckz', 'Sandton Entertainment Deck', 'Multi-level deck with built-in seating for weekend entertaining.', 'Entertainment areas', 'published', 1),
      ('deckz', 'Centurion Pool Deck', 'Barefoot-friendly decking wrapped around the pool.', 'Pool decks', 'published', 2),
      ('deckz', 'Pretoria East Patio Deck', 'Covered patio converted into a true outdoor living room.', 'Patio decking', 'published', 3),
      ('deckz', 'Ballito Balcony Deck', 'Elevated balcony with warm underfoot decking and sea views.', 'Balcony decking', 'published', 4),
      ('deckz', 'Johannesburg Roof Terrace', 'Built-in benches and planters for a city terrace.', 'Outdoor seating areas', 'published', 5),
      ('deckz', 'Hartbeespoort Lakeside Deck', 'Residential deck stepping down toward the water.', 'Residential decking', 'published', 6);
  end if;
end
$$;
