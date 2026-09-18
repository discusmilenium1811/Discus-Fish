-- AKIS Express office pickup.
--
-- Owner rules:
--   • Cyprus (AKIS Express): the customer chooses delivery to their address OR
--     collection from an AKIS Express office. Office orders need no street address,
--     only the chosen office.
--   • Outside Cyprus: UPS only, always to the customer's address.
--
-- A method flagged is_office_pickup makes the cart ask for an AKIS office instead
-- of a street address; the checkout function enforces the same rule.

begin;

alter table public.shipping_methods
  add column if not exists is_office_pickup boolean not null default false;

-- AKIS Express — Office to Office (fixed id from 20260708000000_cyprus_akis_free_shipping.sql).
update public.shipping_methods
  set is_office_pickup = true
  where id = '00000000-0000-0000-0000-0000000000d2';

commit;
