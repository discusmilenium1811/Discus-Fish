-- ─────────────────────────────────────────────────────────────────────────────
-- Pre-launch advisor remediation (2026-08-29)
--
-- Closes the last outstanding SECURITY advisor finding before the shop goes live
-- with real payments:
--
--   anon_security_definer_function_executable · public.is_admin()
--     `is_admin()` is reachable by the anon role over /rest/v1/rpc/is_admin.
--
-- The 2026-07-11 migration deliberately left this alone, and it was right to:
-- revoking EXECUTE from anon on its own would have BROKEN the storefront. Every
-- `*_admin_all` policy is declared for role `public` with `cmd = ALL`, so an
-- anonymous SELECT on e.g. `products` still evaluates `products_admin_all` and
-- therefore still calls `is_admin()`. Without EXECUTE that query errors out and
-- anonymous browsing dies.
--
-- So we fix the cause first, then the symptom:
--
--   1. Narrow all 18 admin policies from `public` to `authenticated`. This cannot
--      remove any access anon actually has — `is_admin()` is false for anon, so
--      those policies already grant it nothing. It just stops anon from having to
--      evaluate them at all (a small win on every public product query too).
--   2. Only then revoke EXECUTE on `is_admin()` from public/anon, keeping it for
--      `authenticated` (RLS policies across every table call it) and for
--      `service_role` (edge functions run as service_role; they bypass RLS, but
--      an explicit grant keeps the function callable if that ever changes).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Admin policies apply to signed-in users only ─────────────────────────────

alter policy "categories_admin_all"              on public.categories              to authenticated;
alter policy "coupons_admin_all"                 on public.coupons                 to authenticated;
alter policy "gift_card_transactions_admin_all"  on public.gift_card_transactions  to authenticated;
alter policy "gift_cards_admin_all"              on public.gift_cards              to authenticated;
alter policy "offers_admin_all"                  on public.offers                  to authenticated;
alter policy "order_items_admin_all"             on public.order_items             to authenticated;
alter policy "orders_admin_all"                  on public.orders                  to authenticated;
alter policy "product_images_admin_all"          on public.product_images          to authenticated;
alter policy "products_admin_all"                on public.products                to authenticated;
alter policy "return_items_admin_all"            on public.return_items            to authenticated;
alter policy "returns_admin_all"                 on public.returns                 to authenticated;
alter policy "reviews_admin_all"                 on public.reviews                 to authenticated;
alter policy "shipments_admin_all"               on public.shipments               to authenticated;
alter policy "shipping_methods_admin_all"        on public.shipping_methods        to authenticated;
alter policy "shipping_rate_tiers_admin_write"   on public.shipping_rate_tiers     to authenticated;
alter policy "shipping_zones_admin_all"          on public.shipping_zones          to authenticated;
alter policy "stock_movements_admin_all"         on public.stock_movements         to authenticated;
alter policy "tracking_events_admin_all"         on public.tracking_events         to authenticated;

-- ── 2. is_admin() is no longer callable by anonymous visitors ───────────────────

revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated, service_role;
