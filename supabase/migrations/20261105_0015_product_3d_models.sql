-- 3D product models: GLB files uploaded from the admin product editor are
-- stored in a public Supabase Storage bucket and referenced from products.
alter table public.products
  add column if not exists model_url text;

-- Bucket holds the GLB files. Writes go through the service role (admin API),
-- which bypasses RLS; public read is provided by the bucket being public.
-- Size (50MB) and the .glb header are validated in the admin API route.
insert into storage.buckets (id, name, public)
values ('zhua-product-models', 'zhua-product-models', true)
on conflict (id) do update
  set public = excluded.public;
