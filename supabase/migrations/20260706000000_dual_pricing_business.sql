-- Dual pricing: business (wholesale) vs. normal (retail) customers.
--
-- Until now every product carried a single price (products.price_cents) that was
-- actually the RESELLER / business wholesale price. The owner now also has the
-- "normal" retail price list for anonymous & personal customers
-- (Price List reseller _26.01.2026.users.odt), matched to products by article
-- number (sku).
--
-- After this migration:
--   * price_cents          = RETAIL (public) price — what anon/personal see & pay.
--   * business_price_cents = the previous wholesale price — shown & charged only
--                            to APPROVED business accounts.
-- Business approval is gated by profiles.business_status; wholesale prices are
-- delivered through the security-definer business_prices() RPC and enforced
-- server-side in the checkout edge function.

-- ── 1) New column + snapshot the current (business) prices ──────────────────
alter table public.products add column if not exists business_price_cents integer;
update public.products
  set business_price_cents = price_cents
  where business_price_cents is null;

-- ── 2) Retail (users) prices by sku — from the ODT "normal" price list ──────
-- Products whose sku isn't present in the live DB are simply not matched (no-op).
update public.products set price_cents =   950, updated_at = now() where sku = '20041'; -- Best Heart Flakes Super Growth
update public.products set price_cents =   950, updated_at = now() where sku = '20042'; -- Best Heart Flakes Pro Breed
update public.products set price_cents =   950, updated_at = now() where sku = '20043'; -- Best Heart Flakes Blue Dream
update public.products set price_cents =   970, updated_at = now() where sku = '20044'; -- Best Heart Flakes Golden Dream
update public.products set price_cents =  1070, updated_at = now() where sku = '20045'; -- Best Heart Flakes Red Dream
update public.products set price_cents =  1950, updated_at = now() where sku = '20050'; -- Artemia 50% Soft Granulate
update public.products set price_cents =  1275, updated_at = now() where sku = '20051'; -- Artemia 50% Flat Granulate
update public.products set price_cents =   865, updated_at = now() where sku = '20052'; -- Artemia 50% Microgranulate Soft
update public.products set price_cents =  1950, updated_at = now() where sku = '20053'; -- Artemia 50% XL Soft Granulate
update public.products set price_cents =  1760, updated_at = now() where sku = '22060'; -- Freshwater Crab 50% Soft Granulate
update public.products set price_cents =   840, updated_at = now() where sku = '22062'; -- Freshwater Crab 50% Microgranulate Soft
update public.products set price_cents =  1758, updated_at = now() where sku = '22063'; -- Freshwater Crab 50% XL Soft Granulate
update public.products set price_cents =   780, updated_at = now() where sku = '20057'; -- Herbs Food
update public.products set price_cents =  1335, updated_at = now() where sku = '20059'; -- Buffet Di Insect Flat Granulate
update public.products set price_cents =  1335, updated_at = now() where sku = '20060'; -- Frutti Di Mare Flat Granulate
update public.products set price_cents =  1798, updated_at = now() where sku = '20061'; -- Brine Shrimps Decapsulated Eggs
update public.products set price_cents =  3476, updated_at = now() where sku = '20062'; -- Brine Shrimps Premium Eggs
update public.products set price_cents =   800, updated_at = now() where sku = '20071'; -- Beef Heart Soft Granulate 80g
update public.products set price_cents =  1800, updated_at = now() where sku = '20712'; -- Beef Heart Soft Granulate 230g
update public.products set price_cents =  2900, updated_at = now() where sku = '20711'; -- Beef Heart Soft Granulate 550g
update public.products set price_cents = 16000, updated_at = now() where sku = '20715'; -- Beef Heart Soft Granulate 2800g
update public.products set price_cents =   750, updated_at = now() where sku = '20055'; -- Grand Champion Granulate 80g
update public.products set price_cents =  1750, updated_at = now() where sku = '20552'; -- Grand Champion Granulate 230g
update public.products set price_cents =   700, updated_at = now() where sku = '20064'; -- Day by Day Granulate 80g
update public.products set price_cents =  1700, updated_at = now() where sku = '20642'; -- Day by Day Granulate 230g
update public.products set price_cents = 11500, updated_at = now() where sku = '20645'; -- Day by Day Granulate 2800g
update public.products set price_cents =   800, updated_at = now() where sku = '20070'; -- Turkey Heart Soft Granulate 80g
update public.products set price_cents =  1800, updated_at = now() where sku = '20702'; -- Turkey Heart Soft Granulate 230g
update public.products set price_cents =   700, updated_at = now() where sku = '20076'; -- American Cichlid Spirulina Pearls
update public.products set price_cents =   700, updated_at = now() where sku = '20077'; -- American Cichlid Colour Pearls
update public.products set price_cents =   700, updated_at = now() where sku = '20078'; -- African Cichlid Spirulina Pearls
update public.products set price_cents =   700, updated_at = now() where sku = '20079'; -- African Cichlid Colour Pearls
update public.products set price_cents =  3500, updated_at = now() where sku = '20030'; -- Cichlids XL Granulate Comp. 1
update public.products set price_cents =  3500, updated_at = now() where sku = '20031'; -- Cichlids XL Granulate Comp. 2
update public.products set price_cents =   950, updated_at = now() where sku = '20001'; -- Pleco Special Soft Granulate 80g
update public.products set price_cents =  1650, updated_at = now() where sku = '20012'; -- Pleco Special Soft Granulate 230g
update public.products set price_cents =  3050, updated_at = now() where sku = '20112'; -- Pleco Special Soft Granulate 550g
update public.products set price_cents =   800, updated_at = now() where sku = '20082'; -- Angelfish Super Growth Soft Granulate 80g
update public.products set price_cents =  1750, updated_at = now() where sku = '20822'; -- Angelfish Super Growth Soft Granulate 230g
update public.products set price_cents =  3050, updated_at = now() where sku = '20823'; -- Angelfish Super Growth Soft Granulate 550g
update public.products set price_cents =   750, updated_at = now() where sku = '20073'; -- Guppy Super Special Soft Granulate
update public.products set price_cents =   750, updated_at = now() where sku = '27475'; -- Guppy Super Color Soft Granulate
update public.products set price_cents =   550, updated_at = now() where sku = '20080'; -- Betta Special all Colors Soft Granulate
update public.products set price_cents =   500, updated_at = now() where sku = '23001'; -- Pleco & Catfish Algae Wafers 50g
update public.products set price_cents =  1250, updated_at = now() where sku = '23012'; -- Pleco & Catfish Algae Wafers 150g
update public.products set price_cents =  3350, updated_at = now() where sku = '23112'; -- Pleco & Catfish Algae Wafers 480g
update public.products set price_cents =   650, updated_at = now() where sku = '23002'; -- Pleco & Catfish Carni Wafers 50g
update public.products set price_cents =  1250, updated_at = now() where sku = '23022'; -- Pleco & Catfish Carni Wafers 150g
update public.products set price_cents =  3150, updated_at = now() where sku = '23122'; -- Pleco & Catfish Carni Wafers 500g
update public.products set price_cents =  2250, updated_at = now() where sku = '20083'; -- Breeder Starter Food I
update public.products set price_cents =  2250, updated_at = now() where sku = '20084'; -- Breeder Starter Food II
update public.products set price_cents =  2350, updated_at = now() where sku = '20288'; -- Beef Heart Paste Color
update public.products set price_cents =  2350, updated_at = now() where sku = '20289'; -- Brine Shrimp / Artemia Paste
update public.products set price_cents =  2350, updated_at = now() where sku = '20293'; -- Shrimp Paste
update public.products set price_cents =  1550, updated_at = now() where sku = '25105'; -- Natural Humin 500ml
update public.products set price_cents =  9850, updated_at = now() where sku = '25150'; -- Natural Humin 5000ml
update public.products set price_cents =  1550, updated_at = now() where sku = '25305'; -- Amazon Tonic 500ml
update public.products set price_cents =  9850, updated_at = now() where sku = '25350'; -- Amazon Tonic 5000ml
update public.products set price_cents =  1550, updated_at = now() where sku = '25405'; -- Anti Tox 500ml
update public.products set price_cents =  1550, updated_at = now() where sku = '25505'; -- Catappa Royal 500ml
update public.products set price_cents =  9850, updated_at = now() where sku = '25550'; -- Catappa Royal 5000ml
update public.products set price_cents =  1950, updated_at = now() where sku = '31000'; -- Bacto+
update public.products set price_cents =  2050, updated_at = now() where sku = '31001'; -- Anti Stress
update public.products set price_cents =  1650, updated_at = now() where sku = '33020'; -- Discus Minerals 300g
update public.products set price_cents =  4550, updated_at = now() where sku = '33050'; -- Discus Minerals 1000g
update public.products set price_cents =  1250, updated_at = now() where sku = '31002'; -- Minerals + Aloe Vera
update public.products set price_cents =  1350, updated_at = now() where sku = '31005'; -- Vitamin Shot
update public.products set price_cents =  2650, updated_at = now() where sku = '32010'; -- Discus Protector 160g
update public.products set price_cents =  3250, updated_at = now() where sku = '32030'; -- Discus Protector 480g
update public.products set price_cents =  1750, updated_at = now() where sku = '30085'; -- Bio Ceramic Filter 150L
update public.products set price_cents =  2550, updated_at = now() where sku = '30086'; -- Bio Ceramic Filter 350L

-- ── 3) Business approval status on profiles ─────────────────────────────────
alter table public.profiles
  add column if not exists business_status text not null default 'pending';
-- Grandfather existing business accounts so they keep wholesale pricing.
update public.profiles set business_status = 'approved' where account_type = 'business';

-- ── 4) Hide the wholesale price from anonymous visitors (the public) ─────────
-- A table-wide GRANT SELECT overrides any per-column REVOKE, so to actually hide
-- one column from `anon` we drop the table-level grant and re-grant every column
-- EXCEPT business_price_cents. `authenticated` keeps full access (admins edit the
-- column; business display still goes through the RPC below).
-- These are exactly the columns the public storefront reads (fetchProducts) plus
-- the FK used for the category embed. NOTE: if the storefront starts reading a
-- new products column for anonymous visitors, add it to this anon grant too.
revoke select on public.products from anon;
grant select (
  id, slug, name, description, details,
  price_cents, currency, image_url, weight_grams, stock,
  is_active, is_coming_soon, category_id, created_at
) on public.products to anon;

-- ── 5) Effective business prices — only for APPROVED business accounts ──────
-- SECURITY DEFINER so it can read profiles regardless of RLS. Returns nothing to
-- anonymous or personal callers, so wholesale prices never leak to them.
create or replace function public.business_prices()
returns table(id uuid, price_cents integer)
language sql security definer stable set search_path = public as $$
  select p.id, p.business_price_cents
  from public.products p
  where p.is_active and p.business_price_cents is not null
    and exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid()
        and pr.account_type = 'business'
        and pr.business_status = 'approved'
    );
$$;
revoke all on function public.business_prices() from public;
grant execute on function public.business_prices() to authenticated;

-- ── 6) Admin-only approval control ──────────────────────────────────────────
-- profiles UPDATE is revoked from `authenticated` (harden_admin_access), so
-- admins flip the status through this checked security-definer function.
create or replace function public.admin_set_business_status(target uuid, new_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;
  if new_status not in ('pending', 'approved', 'rejected') then
    raise exception 'invalid status: %', new_status;
  end if;
  update public.profiles set business_status = new_status where id = target;
end;
$$;
revoke all on function public.admin_set_business_status(uuid, text) from public;
grant execute on function public.admin_set_business_status(uuid, text) to authenticated;

-- ── 7) Admin listing of business accounts ───────────────────────────────────
-- profiles SELECT is owner-only for clients, so admins read the business roster
-- through this checked security-definer function (pending first).
create or replace function public.admin_list_business_accounts()
returns table (
  id uuid,
  email text,
  username text,
  company_name text,
  vat_number text,
  contact_name text,
  phone text,
  country text,
  business_status text
) language sql security definer stable set search_path = public as $$
  select p.id, p.email, p.username, p.company_name, p.vat_number,
         p.contact_name, p.phone, p.country, p.business_status
  from public.profiles p
  where p.account_type = 'business'
    and exists (select 1 from public.profiles a where a.id = auth.uid() and a.role = 'admin')
  order by
    case p.business_status when 'pending' then 0 when 'approved' then 1 else 2 end,
    p.company_name nulls last;
$$;
revoke all on function public.admin_list_business_accounts() from public;
grant execute on function public.admin_list_business_accounts() to authenticated;
