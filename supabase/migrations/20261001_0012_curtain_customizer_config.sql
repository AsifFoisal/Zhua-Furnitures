-- Curtain Customizer admin-controlled configuration.
-- Everything the customer-facing customizer uses (availability, fabric prices,
-- heading fullness, lining/layer/track/installation pricing, colours) lives in
-- this JSON column and is edited from the admin dashboard
-- (Admin -> Curtain Customizer). The customer page falls back to in-app
-- defaults when the column is empty or invalid.

alter table public.store_settings
  add column if not exists curtain_customizer_config jsonb not null default '{}'::jsonb;
