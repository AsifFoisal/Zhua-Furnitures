-- Catalog fields for the WALLZ & DECKZ hybrid catalog.
--
-- Extends division_items so every catalog entry (completed project or
-- pre-designed concept) can be fully managed from /admin/divisions:
-- pricing, cost breakdown, specifications, finishes and a photo gallery.
-- All new columns are nullable/defaulted so existing rows keep working.

alter table public.division_items
  add column if not exists kind text not null default 'completed'
    check (kind in ('completed', 'concept')),
  add column if not exists starting_price integer
    check (starting_price is null or starting_price >= 0),
  add column if not exists cost_materials integer
    check (cost_materials is null or cost_materials >= 0),
  add column if not exists cost_labour integer
    check (cost_labour is null or cost_labour >= 0),
  add column if not exists dimensions text,
  add column if not exists materials jsonb not null default '[]'::jsonb,
  add column if not exists finishes jsonb not null default '[]'::jsonb,
  add column if not exists inclusions jsonb not null default '[]'::jsonb,
  add column if not exists gallery jsonb not null default '[]'::jsonb,
  add column if not exists lead_time text,
  add column if not exists location text,
  add column if not exists completed_year integer;

-- Align the seeded demo rows with the canonical catalog taxonomy so the
-- public filter pills stay clean (safe: matches the 0014 seed rows only).
update public.division_items set category = 'Wooden & Timber Slat Panels'
  where division = 'wallz' and category = 'Slat walls';
update public.division_items set category = 'TV & Media Walls'
  where division = 'wallz' and category = 'TV feature walls';
update public.division_items set category = 'Decorative Wall Cladding'
  where division = 'wallz' and category in ('Headboard walls', 'Wood-look cladding');
update public.division_items set category = 'Modern Wall Finishes'
  where division = 'wallz' and category in ('Accent walls', 'Commercial installations');

update public.division_items set category = 'Wooden & Composite Decks'
  where division = 'deckz' and category in ('Balcony decking', 'Residential decking');
update public.division_items set category = 'Outdoor Patios'
  where division = 'deckz' and category = 'Patio decking';
update public.division_items set category = 'Pool Decks'
  where division = 'deckz' and category = 'Pool decks';
update public.division_items set category = 'Outdoor Entertainment Areas'
  where division = 'deckz' and category in ('Entertainment areas', 'Outdoor seating areas');
