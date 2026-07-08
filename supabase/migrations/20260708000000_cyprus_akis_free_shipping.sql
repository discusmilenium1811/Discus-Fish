-- Cyprus (AKIS Express) domestic shipping rework.
--
-- Rules requested by the owner:
--   • Free delivery ONLY in Cyprus (Republic of Cyprus / South — country code CY),
--     handled exclusively by AKIS Express. North Cyprus is not served.
--   • AKIS office → office: FREE up to 5 kg of products (net weight); €5 flat over 5 kg.
--   • AKIS to the customer's address (not an office): flat €7.50.
--   • No amount-based ("free over €X") free shipping anywhere — every other zone is
--     UPS weight-based with no free threshold.
--
-- The 5 kg threshold is on NET product weight (packaging tare is not counted).

begin;

-- 1. Per-method weight-based free-shipping fields (used by domestic AKIS methods).
--    free_under_grams: net weight at/under which the method is free.
--    over_weight_price_cents: flat price charged when net weight exceeds the threshold.
alter table public.shipping_methods
  add column if not exists free_under_grams integer,
  add column if not exists over_weight_price_cents integer;

-- 2. Drop amount-based free shipping across ALL methods (no more "free over €X").
update public.shipping_methods set free_over_cents = null;

-- 3. Cyprus zone → domestic AKIS Express, South Cyprus (CY) only.
update public.shipping_zones
  set is_active   = true,
      is_domestic = true,
      zone_code   = 'CY',
      name        = 'Cyprus — AKIS Express',
      countries   = array['CY']::text[],
      over_kg_cents = null
  where id = '00000000-0000-0000-0000-0000000000d1';

-- 4. Rebuild the Cyprus delivery options as the two AKIS Express methods.
--    Detach any historical order that referenced an old Cyprus method first
--    (orders.shipping_method_id has no cascade), then replace the methods.
update public.orders set shipping_method_id = null
  where shipping_method_id in (
    select id from public.shipping_methods
    where zone_id = '00000000-0000-0000-0000-0000000000d1'
  );
delete from public.shipping_methods
  where zone_id = '00000000-0000-0000-0000-0000000000d1';

insert into public.shipping_methods
  (id, zone_id, name, description, price_cents, free_over_cents,
   free_under_grams, over_weight_price_cents,
   estimated_days_min, estimated_days_max, is_active, sort_order)
values
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000d1',
   'AKIS Express — Office to Office',
   'Collect from an AKIS Express office in Cyprus. Free up to 5 kg; €5 flat over 5 kg.',
   0, null, 5000, 500, 1, 2, true, 1),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000d1',
   'AKIS Express — Home Delivery',
   'AKIS Express delivery to your address in Cyprus. Flat €7.50.',
   750, null, null, null, 1, 3, true, 2)
on conflict (id) do update set
  zone_id                 = excluded.zone_id,
  name                    = excluded.name,
  description             = excluded.description,
  price_cents             = excluded.price_cents,
  free_over_cents         = excluded.free_over_cents,
  free_under_grams        = excluded.free_under_grams,
  over_weight_price_cents = excluded.over_weight_price_cents,
  estimated_days_min      = excluded.estimated_days_min,
  estimated_days_max      = excluded.estimated_days_max,
  is_active               = excluded.is_active,
  sort_order              = excluded.sort_order;

commit;
