-- Curtain-specific product attributes added to the admin product form.
-- Both are option lists (like fabrics/colors): one curtain product can be
-- offered in several light-filtration and heading (top style) variants.

alter table public.products
  add column if not exists light_filtration text[] not null default '{}',
  add column if not exists top_styles text[] not null default '{}';

comment on column public.products.light_filtration is
  'Curtain light-filtration options, e.g. Sheer, Room Darkening, Blockout.';
comment on column public.products.top_styles is
  'Curtain heading / top-style options, e.g. Eyelet, Pinch Pleat, S-Fold Wave.';
