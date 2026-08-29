-- ─────────────────────────────────────────────────────────────────────────────
-- Fulfilment hardening (2026-08-29)
--
-- Found while driving the paid → shipped → delivered flow end-to-end for the
-- first time. The flow itself works; these are three integrity gaps around it.
-- Both tables are empty at the time of writing, so every change below is a
-- metadata-only operation with no data to migrate or lose.
--
--   1. tracking_events.occurred_at is a dead duplicate of event_at. Nothing
--      writes it and nothing reads it — the admin form writes event_at
--      (src/admin/pages/Tracking.tsx) and the customer page orders and renders
--      by event_at (src/lib/tracking.ts). It silently takes the row's INSERT
--      time, so the moment anyone backdates an event the two columns disagree
--      with no warning. Drop it.
--
--   2. shipments.status and tracking_events.status were free `text`. The six
--      valid UPS stages existed only in the TypeScript `DeliveryStatus` union,
--      so nothing at the database level rejected an arbitrary string. Promote
--      them to a real enum, matching how the rest of this schema models status
--      (fulfillment_status, review_status, return_status, …).
--
--   3. Nothing stopped an order from collecting more than one shipment, and the
--      admin "Add delivery" picker listed every order including ones already
--      shipped. A second shipment would be invisible to the customer, because
--      src/lib/tracking.ts fetchMyDeliveries() takes only the first match per
--      order. Enforce one shipment per order.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Drop the dead duplicate timestamp ────────────────────────────────────
alter table public.tracking_events drop column if exists occurred_at;

-- ── 2. Constrain the delivery stage to the six the app actually uses ────────
do $$
begin
  if not exists (select 1 from pg_type t
                 join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'delivery_status') then
    create type public.delivery_status as enum (
      'label_created',
      'on_the_way',
      'out_for_delivery',
      'access_point',
      'delivered',
      'exception'
    );
  end if;
end $$;

-- The default has to come off before the type change and go back on after,
-- otherwise Postgres cannot cast the existing default expression.
alter table public.shipments alter column status drop default;
alter table public.shipments
  alter column status type public.delivery_status
  using status::public.delivery_status;
alter table public.shipments
  alter column status set default 'label_created'::public.delivery_status;

alter table public.tracking_events
  alter column status type public.delivery_status
  using status::public.delivery_status;

-- ── 3. One shipment per order ───────────────────────────────────────────────
alter table public.shipments
  add constraint shipments_order_id_key unique (order_id);

-- The unique constraint above creates its own index on order_id, which makes
-- the old plain btree index redundant.
drop index if exists public.shipments_order_idx;
