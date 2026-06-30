-- Real reseller prices (EUR) for the existing "old"/available products.
-- Source: "Price List reseller _26.01.2026.odt" (Discus Milenium), matched to
-- products by article number (sku). Until now every old product carried a
-- €10.00 placeholder (price_cents = 1000). New / "coming soon" products are
-- intentionally left untouched — we don't have final retail prices for them.
--
-- Matched 36 products directly by sku + 2 article-number corrections, plus:
--   * adds "Best Heart Flakes Golden Dream" (20044, €6.67) as a new product;
--   * splits "Discus Protector" into 160g (32010, €18.84) and a new 480g
--     (32030, €23.65) pack — same formula, different size/price.
-- 9 old products have NO reseller price (additives, colour boosters, Organic
-- Clear, Breeding Filter, Artemia Soft Tabs, generic Best Heart Flakes) and are
-- DEACTIVATED (is_active = false) so they leave the storefront — see the end.

-- ── Best Heart Flakes range ────────────────────────────────────────────────
UPDATE public.products SET price_cents =  655, updated_at = now() WHERE slug = 'super-growth';                 -- €6.55  20041
UPDATE public.products SET price_cents =  655, updated_at = now() WHERE slug = 'best-heart-flakes-pro-breed';  -- €6.55  20042
UPDATE public.products SET price_cents =  655, updated_at = now() WHERE slug = 'best-heart-flakes-blue-dream'; -- €6.55  20043
UPDATE public.products SET price_cents =  794, updated_at = now() WHERE slug = 'best-heart-flakes-red-dream';  -- €7.94  20045

-- ── Artemia 50% range ──────────────────────────────────────────────────────
UPDATE public.products SET price_cents = 1461, updated_at = now() WHERE slug = 'artemia-50-soft-granulate';       -- €14.61  20050
UPDATE public.products SET price_cents =  955, updated_at = now() WHERE slug = 'artemia-50-flat-granulate';       -- €9.55   20051
UPDATE public.products SET price_cents =  647, updated_at = now() WHERE slug = 'artemia-50-micro-granulate-soft'; -- €6.47   20052
UPDATE public.products SET price_cents = 1349, updated_at = now() WHERE slug = 'decapsulated-artemia-eggs';       -- €13.49  20061
UPDATE public.products SET price_cents = 2607, updated_at = now() WHERE slug = 'artemia-50-cysts';                -- €26.07  20062 (Brine Shrimps Premium Eggs)

-- ── Flat granulate specialities ────────────────────────────────────────────
UPDATE public.products SET price_cents = 1001, updated_at = now() WHERE slug = 'buffet-di-insect'; -- €10.01  20059
UPDATE public.products SET price_cents = 1001, updated_at = now() WHERE slug = 'frutti-di-mare';   -- €10.01  20060

-- ── Heart / daily granulates ───────────────────────────────────────────────
UPDATE public.products SET price_cents =  365, updated_at = now() WHERE slug = 'for-discus-daily-granulate';  -- €3.65  20064 (Day by Day 80g)
UPDATE public.products SET price_cents =  465, updated_at = now() WHERE slug = 'turkey-heart-soft-granulate';  -- €4.65  20070
UPDATE public.products SET price_cents =  465, updated_at = now() WHERE slug = 'beef-heart-soft-granulate';    -- €4.65  20071

-- ── Cichlid / ornamental specials ──────────────────────────────────────────
UPDATE public.products SET price_cents =  473, updated_at = now() WHERE slug = 'american-cichlids-spirulina-soft-pearls'; -- €4.73  20076
UPDATE public.products SET price_cents =  473, updated_at = now() WHERE slug = 'american-cichlids-color-soft-pearls';     -- €4.73  20077
UPDATE public.products SET price_cents =  473, updated_at = now() WHERE slug = 'african-cichlids-spirulina-soft-pearls';  -- €4.73  20078
UPDATE public.products SET price_cents =  473, updated_at = now() WHERE slug = 'african-cichlids-color-soft-pearls';      -- €4.73  20079
UPDATE public.products SET price_cents = 2523, updated_at = now() WHERE slug = 'cichlids-xl-granulate-1';                 -- €25.23 20030
UPDATE public.products SET price_cents = 2523, updated_at = now() WHERE slug = 'cichlids-xl-granulate-2';                 -- €25.23 20031
UPDATE public.products SET price_cents =  473, updated_at = now() WHERE slug = 'angelfish-special-soft-granulate';        -- €4.73  20082 (80g)
UPDATE public.products SET price_cents = 1088, updated_at = now() WHERE slug = 'wels-special-soft';                       -- €10.88 20012 (Pleco/Catfish 230g)

-- ── Guppy / Betta ──────────────────────────────────────────────────────────
UPDATE public.products SET price_cents =  523, updated_at = now() WHERE slug = 'guppy-super-special-soft';      -- €5.23  20073
UPDATE public.products SET price_cents =  523, updated_at = now() WHERE slug = 'guppy-super-color-soft';        -- €5.23  27475
UPDATE public.products SET price_cents =  359, updated_at = now() WHERE slug = 'betta-special-all-colors-soft'; -- €3.59  20080

-- ── Pleco & Catfish wafers ─────────────────────────────────────────────────
UPDATE public.products SET price_cents =  873, updated_at = now() WHERE slug = 'pleco-catfish-algae-wafers'; -- €8.73  23012 (150g)
UPDATE public.products SET price_cents =  831, updated_at = now() WHERE slug = 'pleco-catfish-carni-wafers'; -- €8.31  23022 (150g)

-- ── Breeder starter foods ──────────────────────────────────────────────────
UPDATE public.products SET price_cents = 1639, updated_at = now() WHERE slug = 'breeder-starter-food-1'; -- €16.39  20083
UPDATE public.products SET price_cents = 1639, updated_at = now() WHERE slug = 'breeder-starter-food-2'; -- €16.39  20084

-- ── Water conditioners ─────────────────────────────────────────────────────
UPDATE public.products SET price_cents = 1011, updated_at = now() WHERE slug = 'natural-humin'; -- €10.11  25105 (500ml)
UPDATE public.products SET price_cents = 1011, updated_at = now() WHERE slug = 'amazon-tonic';  -- €10.11  25305 (500ml)
UPDATE public.products SET price_cents = 1011, updated_at = now() WHERE slug = 'anti-tox';      -- €10.11  25405 (500ml)
UPDATE public.products SET price_cents = 1011, updated_at = now() WHERE slug = 'royal-catappa'; -- €10.11  25505 (500ml)

-- ── Minerals & equipment ───────────────────────────────────────────────────
UPDATE public.products SET price_cents = 1174, updated_at = now() WHERE slug = 'discus-minerals';      -- €11.74  33020 (300g)
UPDATE public.products SET price_cents = 1240, updated_at = now() WHERE slug = 'bio-sponge-filter-150'; -- €12.40  30085 (Bio Ceramic Filter 150L)
UPDATE public.products SET price_cents = 1837, updated_at = now() WHERE slug = 'bio-sponge-filter-350'; -- €18.37  30086 (Bio Ceramic Filter 350L)

-- ── Article-number (sku) corrections ───────────────────────────────────────
-- Grand Champion 80g is article 20055 (was a placeholder "DF-GCG-001").
UPDATE public.products SET sku = '20055', price_cents = 441, updated_at = now() WHERE slug = 'grand-champion-granulate'; -- €4.41  20055
-- "Catfish Special" (coming soon) had 20823, which is actually Angelfish 550g.
-- The Pleco/Catfish Special 550g is article 20112. Price stays unset (coming soon).
UPDATE public.products SET sku = '20112', updated_at = now() WHERE slug = 'catfish-special-soft-granulate'; -- 20112 (Pleco/Catfish 550g)

-- ── New product: Best Heart Flakes Golden Dream (20044, €6.67) ──────────────
-- Added as its own colour-food variant alongside Blue/Red Dream. The generic
-- "best-heart-flakes" item is intentionally left untouched.
-- NOTE: upload the photo to product-images/products/clean/best-heart-flakes-golden-dream.png
insert into public.products (
  slug, name, description, price_cents, currency, image_url,
  weight_grams, stock, is_active, is_coming_soon, category_id, sku, track_inventory
)
select
  'best-heart-flakes-golden-dream',
  'Best Heart Flakes Golden Dream',
  'Best Heart flake with Color Booster Golden to intensively support golden and yellow pigmentation, plus vitamins, minerals and probiotics. A supplementary colour food.',
  667,
  'eur',
  'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/best-heart-flakes-golden-dream.png',
  65,
  100,
  true,
  false,
  c.id,
  '20044',
  true
from public.categories c
where c.slug = 'color-enhancers'
on conflict (slug) do nothing;

-- ── Discus Protector: two pack sizes, same formula, different price ─────────
-- Existing product becomes the 160g pack (32010, €18.84)...
UPDATE public.products
SET name = 'Discus Protector 160g', sku = '32010', price_cents = 1884,
    weight_grams = 160, updated_at = now()
WHERE slug = 'discus-protector';
-- ...and add the 480g pack (32030, €23.65) as a separate product.
insert into public.products (
  slug, name, description, price_cents, currency, image_url,
  weight_grams, stock, is_active, is_coming_soon, category_id, sku, track_inventory
)
select
  'discus-protector-480g',
  'Discus Protector 480g',
  'The proven quarantine-bath treatment for new discus and fish — used over 100,000 times worldwide for safe acclimatisation. A 15-minute short bath before stocking. Read the instructions before use. (480 g pack.)',
  2365,
  'eur',
  'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/discus-protector.png',
  480,
  100,
  true,
  false,
  c.id,
  '32030',
  true
from public.categories c
where c.slug = 'preparations'
on conflict (slug) do nothing;

-- ── Remove old products stuck at the €10.00 placeholder (no reseller price) ─
-- These have no price in the reseller list, so they're taken off the storefront.
-- Deactivating (not deleting) keeps order history / reviews intact and is
-- reversible: set is_active = true again once a real price is available.
-- Keyed by slug (not by price_cents) so it never depends on run order.
UPDATE public.products SET is_active = false, updated_at = now()
WHERE slug IN (
  'additive-1-probiotics',      -- 20110
  'additive-d7-pro-breeding',   -- 20130
  'red-color-booster',          -- 20180
  'blue-color-booster',         -- 20190
  'golden-color-booster',       -- 20210
  'organic-clear',              -- 25205
  'breeding-filter',            -- 30087
  'artemia-50-soft-tabs',       -- (no article no.)
  'best-heart-flakes'           -- generic staple, no article no. / price
);

-- Permanent delete alternative (run instead of the UPDATE above if you want
-- the rows gone for good — order_items keep their snapshotted name/price):
-- DELETE FROM public.products WHERE slug IN (
--   'additive-1-probiotics','additive-d7-pro-breeding','red-color-booster',
--   'blue-color-booster','golden-color-booster','organic-clear',
--   'breeding-filter','artemia-50-soft-tabs','best-heart-flakes'
-- );
