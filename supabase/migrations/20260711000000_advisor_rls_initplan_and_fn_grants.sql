-- ─────────────────────────────────────────────────────────────────────────────
-- Supabase Advisor remediation (2026-07-11)
--
-- Fixes two advisor findings without changing any access semantics:
--
--   1. PERFORMANCE · auth_rls_initplan (14 policies)
--      Each flagged policy calls auth.uid() directly, so Postgres re-evaluates it
--      once PER ROW. Wrapping it as (select auth.uid()) makes the planner evaluate
--      it ONCE per query (an initplan). Same result, far cheaper at scale.
--      Ref: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
--   2. SECURITY · {anon,authenticated}_security_definer_function_executable
--      SECURITY DEFINER functions should not be executable by roles that never
--      need to call them. We revoke EXECUTE from PUBLIC/anon where inappropriate
--      and keep it only where the app actually calls the function.
--
-- NOT changed here (deliberate):
--   · is_admin()  — must stay EXECUTE-able by authenticated because RLS policies
--                   across every table call it; it is SECURITY DEFINER with a fixed
--                   search_path and only returns a boolean, so the risk is minimal.
--   · auth_leaked_password_protection — Supabase Pro-only; already mitigated with a
--                   client-side HIBP check.
--   · multiple_permissive_policies (85) / unused_index (29) — deferred (low value
--                   pre-launch; the unused indexes are FK indexes on an empty DB).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. RLS initplan: auth.uid() → (select auth.uid()) ───────────────────────────

alter policy "order_items_owner_read" on public.order_items
  using (exists (select 1 from orders o
                 where o.id = order_items.order_id
                   and o.user_id = (select auth.uid())));

alter policy "Customers can view own delivery orders" on public.orders
  using (user_id = (select auth.uid()));

alter policy "orders_owner_read" on public.orders
  using ((select auth.uid()) = user_id);

alter policy "profiles_select_own" on public.profiles
  using ((select auth.uid()) = id);

alter policy "returns_owner_insert" on public.returns
  with check (((select auth.uid()) = user_id)
              and exists (select 1 from orders o
                          where o.id = returns.order_id
                            and o.user_id = (select auth.uid())));

alter policy "returns_owner_read" on public.returns
  using ((select auth.uid()) = user_id);

alter policy "reviews_contact_insert" on public.reviews
  with check ((user_id = (select auth.uid()))
              and (status = 'pending'::review_status)
              and (comment like '[[contact-review]]%'));

alter policy "reviews_owner_insert" on public.reviews
  with check (((select auth.uid()) = user_id)
              and (status = 'pending'::review_status)
              and exists (select 1 from orders o
                          where o.id = reviews.order_id
                            and o.user_id = (select auth.uid())
                            and o.status = 'paid'));

alter policy "reviews_owner_read" on public.reviews
  using ((select auth.uid()) = user_id);

alter policy "Customers can view own shipments" on public.shipments
  using (exists (select 1 from orders
                 where orders.id = shipments.order_id
                   and orders.user_id = (select auth.uid())));

alter policy "shipments_owner_read" on public.shipments
  using (exists (select 1 from orders o
                 where o.id = shipments.order_id
                   and o.user_id = (select auth.uid())));

alter policy "Admins can manage tracking events" on public.tracking_events
  using (exists (select 1 from profiles
                 where profiles.id = (select auth.uid())
                   and profiles.role = 'admin'::user_role))
  with check (exists (select 1 from profiles
                      where profiles.id = (select auth.uid())
                        and profiles.role = 'admin'::user_role));

alter policy "Customers can view own tracking events" on public.tracking_events
  using (exists (select 1 from shipments
                 join orders on orders.id = shipments.order_id
                 where shipments.id = tracking_events.shipment_id
                   and orders.user_id = (select auth.uid())));

alter policy "tracking_events_owner_read" on public.tracking_events
  using (exists (select 1 from shipments s
                 join orders o on o.id = s.order_id
                 where s.id = tracking_events.shipment_id
                   and o.user_id = (select auth.uid())));

-- ── 2. Tighten EXECUTE on SECURITY DEFINER functions ───────────────────────────

-- Trigger-only functions: fired by the trigger mechanism, never called directly.
-- (A triggering statement does not require EXECUTE on the trigger function.)
revoke execute on function public.handle_new_user()   from public, anon, authenticated;
revoke execute on function public.auto_confirm_email() from public, anon, authenticated;

-- Internal utility: auto-enables RLS; not a client-facing API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Wholesale price overlay: only ever called by a signed-in (business) user.
revoke execute on function public.business_prices() from public, anon;
grant  execute on function public.business_prices() to authenticated;

-- Admin RPCs: guard on is_admin() internally, but anon should never reach them.
revoke execute on function public.admin_list_business_accounts() from public, anon;
grant  execute on function public.admin_list_business_accounts() to authenticated;

revoke execute on function public.admin_set_business_status(uuid, text) from public, anon;
grant  execute on function public.admin_set_business_status(uuid, text) to authenticated;
