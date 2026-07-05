-- Complete the storefront "Products" (available) page from the reseller price
-- list "Price List reseller _26.01.2026.odt" (Discus Milenium), which contains
-- 71 orderable line items. Before this migration only 40 of them were live on
-- the Products page. This migration brings the Products page up to all 71:
--
--   * Section A — promotes the 8 items that were sitting on "New products
--     (coming soon)" but already have a reseller price. They move to Products
--     with their real price + a size/volume in the name.
--   * Section B — appends the pack size to the 12 existing base products that
--     now gain sibling sizes, so the cards don't read as duplicates, and fills
--     in their weight where it was missing.
--   * Section C — inserts the 23 line items that were not in the database at
--     all, as available products with their reseller price.
--
-- Intentionally LEFT UNTOUCHED: the 14 remaining "New products" that are NOT in
-- the reseller list and still have no final price — FD range (24001–24006),
-- NaturePur / FirstBite (40001–40004), the three Nitrate Removers and LAB &
-- Herbs (31006). They stay is_coming_soon = true until prices arrive.
--
-- Prices are stored in cents (EUR). All keyed by slug so the migration is
-- idempotent / order-independent; inserts use ON CONFLICT (slug) DO NOTHING.
--
-- PHOTOS STILL NEEDED (added with image_url = NULL, storefront shows a faint
-- discus backdrop until a real shot is uploaded via the admin panel):
--   Freshwater Crab ×3 (22060/22062/22063), Herbs Food (20057),
--   Beef Heart Paste Color (20288), Brine Shrimp/Artemia Paste (20289),
--   Shrimp Paste (20293).


-- ════════════════════════════════════════════════════════════════════════════
--  SECTION A · Promote 8 "coming soon" items to the Products page
--  (they already carry a reseller price). is_coming_soon → false, real price,
--  size in the name, stock made sellable. Rows that already store a real photo
--  in the "New products Coming Soon" bucket keep it (it becomes visible once
--  is_coming_soon is false); the two without one borrow a sibling image.
-- ════════════════════════════════════════════════════════════════════════════

-- Beef Heart Soft Granulate 550g — 20711 — €21.75 (keeps its own photo)
UPDATE public.products SET
  name = 'Beef Heart Soft Granulate 550g', price_cents = 2175, weight_grams = 550,
  is_coming_soon = false, stock = 100, updated_at = now()
WHERE slug = 'beef-heart-soft-granules';

-- Wels (Catfish) Special Soft Granulate 550g — 20112 — €21.75 (borrow wels photo)
UPDATE public.products SET
  name = 'Wels (Catfish) Special Soft Granulate 550g', price_cents = 2175, weight_grams = 550,
  is_coming_soon = false, stock = 100,
  image_url = 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/wels-special-soft.jpg',
  updated_at = now()
WHERE slug = 'catfish-special-soft-granulate';

-- Pleco & Catfish Algae Wafers 480g — 23112 — €24.15 (keeps its own photo)
UPDATE public.products SET
  name = 'Pleco & Catfish Algae Wafers 480g', price_cents = 2415, weight_grams = 480,
  is_coming_soon = false, stock = 100, updated_at = now()
WHERE slug = 'plecs-catfish-algae-wafers';

-- Pleco & Catfish Carni Wafers 500g — 23122 — €22.60 (borrow carni photo)
UPDATE public.products SET
  name = 'Pleco & Catfish Carni Wafers 500g', price_cents = 2260, weight_grams = 500,
  is_coming_soon = false, stock = 100,
  image_url = 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/pleco-catfish-carni-wafers.png',
  updated_at = now()
WHERE slug = 'plecs-catfish-carni-wafers';

-- Bacto+ (Filter Starter Bacteria) 500ml — 31000 — €14.13 (keeps its own photo)
UPDATE public.products SET
  price_cents = 1413, is_coming_soon = false, stock = 100, updated_at = now()
WHERE slug = 'bacto-bakterien';

-- Anti-Stress (Aloe Vera & B-Vitamins) 500ml — 31001 — €14.79 (keeps its own photo)
UPDATE public.products SET
  price_cents = 1479, is_coming_soon = false, stock = 100, updated_at = now()
WHERE slug = 'anti-stress';

-- Minerals + Aloe Vera (Sodium-Chloride-Free) 150g — 31002 — €8.49 (keeps its own photo)
UPDATE public.products SET
  price_cents = 849, weight_grams = 150, is_coming_soon = false, stock = 100, updated_at = now()
WHERE slug = 'minerals-no-salt';

-- Vitamin-Shot 150ml — 31005 — €9.13 (keeps its own photo)
UPDATE public.products SET
  price_cents = 913, is_coming_soon = false, stock = 100, updated_at = now()
WHERE slug = 'vitamin-shot';


-- ════════════════════════════════════════════════════════════════════════════
--  SECTION B · Add the pack size to the existing base products that now gain
--  sibling sizes (and fill in weight_grams where it was NULL) so the Products
--  page doesn't show several identically-named cards. Slugs are unchanged.
-- ════════════════════════════════════════════════════════════════════════════

UPDATE public.products SET name = 'Beef Heart Soft Granulate 80g',            weight_grams = 80,  updated_at = now() WHERE slug = 'beef-heart-soft-granulate';      -- 20071
UPDATE public.products SET name = 'Grand Champion Granulate 80g',             weight_grams = 80,  updated_at = now() WHERE slug = 'grand-champion-granulate';        -- 20055
UPDATE public.products SET name = 'For Discus Daily Granulate 80g',           weight_grams = 80,  updated_at = now() WHERE slug = 'for-discus-daily-granulate';      -- 20064
UPDATE public.products SET name = 'Turkey Heart Soft Granulate 80g',          weight_grams = 80,  updated_at = now() WHERE slug = 'turkey-heart-soft-granulate';     -- 20070
UPDATE public.products SET name = 'Wels (Catfish) Special Soft Granulate 230g', weight_grams = 230, updated_at = now() WHERE slug = 'wels-special-soft';             -- 20012
UPDATE public.products SET name = 'Angelfish Special Soft Granulate 80g',     weight_grams = 80,  updated_at = now() WHERE slug = 'angelfish-special-soft-granulate'; -- 20082
UPDATE public.products SET name = 'Pleco & Catfish Algae Wafers 150g',        weight_grams = 150, updated_at = now() WHERE slug = 'pleco-catfish-algae-wafers';      -- 23012
UPDATE public.products SET name = 'Pleco & Catfish Carni Wafers 150g',        weight_grams = 150, updated_at = now() WHERE slug = 'pleco-catfish-carni-wafers';      -- 23022
UPDATE public.products SET name = 'Discus Minerals 300g',                     weight_grams = 300, updated_at = now() WHERE slug = 'discus-minerals';                -- 33020
UPDATE public.products SET name = 'Natural Humin 500ml',                                          updated_at = now() WHERE slug = 'natural-humin';                  -- 25105
UPDATE public.products SET name = 'Amazon Tonic 500ml',                                           updated_at = now() WHERE slug = 'amazon-tonic';                   -- 25305
UPDATE public.products SET name = 'Royal Catappa 500ml',                                          updated_at = now() WHERE slug = 'royal-catappa';                  -- 25505


-- ════════════════════════════════════════════════════════════════════════════
--  SECTION C · Insert the 23 reseller items that were missing from the database
--  entirely, as available products (is_coming_soon = false) with reseller price.
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO public.products (
  slug, name, description, price_cents, currency,
  image_url, weight_grams, stock, is_active, is_coming_soon,
  category_id, sku, track_inventory
)
SELECT
  v.slug, v.name, v.description, v.price_cents, 'eur',
  v.image_url, v.weight_grams, 100, true, false,
  c.id, v.sku, true
FROM (
  VALUES
    -- slug, name, description, price_cents, weight_grams, image_url, sku, category slug
    ('artemia-50-xl-soft-granulate', 'Artemia 50% XL Soft Granulate',
     'Soft, anti-swell 50% Artemia granulate for small to large fish — also loved by shrimp keepers. Available as Soft (0.5–0.8 mm) and XL (1.5–2 mm).',
     1461, 150, 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/artemia-50-soft-granulate.png', '20053', 'discus-food'),

    ('freshwater-crab-soft-granulate', 'Freshwater Crab 50% Soft Granulate',
     'Soft, anti-swell granulate with 50% freshwater crab — a natural, highly digestible source of protein, minerals and chitin for shrimp, crayfish, crabs and omnivorous fish. Soft grain (0.5–0.8 mm).',
     1319, 150, NULL, '22060', 'discus-food'),

    ('freshwater-crab-micro-granulate-soft', 'Freshwater Crab 50% Micro Granulate Soft',
     'Ultra-fine soft micro-granulate with 50% freshwater crab for shrimplets, larvae and small-mouthed fish — rich in natural protein, minerals and chitin. The soft coating stops it swelling in the gut.',
     630, 45, NULL, '22062', 'discus-food'),

    ('freshwater-crab-xl-soft-granulate', 'Freshwater Crab 50% XL Soft Granulate',
     'Soft, anti-swell XL granulate (1.5–2 mm) with 50% freshwater crab for larger shrimp, crayfish, crabs and omnivorous fish — a natural source of protein, minerals and chitin.',
     1319, 150, NULL, '22063', 'discus-food'),

    ('herbs-food', 'Herbs Food',
     'Plant- and herb-based flake food rich in vegetable fibre and secondary plant compounds to support digestion and add dietary variety for herbivorous and omnivorous fish.',
     574, 30, NULL, '20057', 'discus-food'),

    ('beef-heart-soft-granulate-230g', 'Beef Heart Soft Granulate 230g',
     'Soft, anti-swell complete granulate made from easily digestible pure beef protein (no blood, no long-chain collagen). Far lower water pollution than frozen beef heart. Sizes 80 g / 230 g / 550 g / 2800 g.',
     1089, 230, 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/beef-heart-soft-granulate.png', '20712', 'discus-food'),

    ('beef-heart-soft-granulate-2800g', 'Beef Heart Soft Granulate 2800g',
     'Soft, anti-swell complete granulate made from easily digestible pure beef protein (no blood, no long-chain collagen). Far lower water pollution than frozen beef heart. Bulk 2800 g pack.',
     10833, 2800, 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/beef-heart-soft-granulate.png', '20715', 'discus-food'),

    ('grand-champion-granulate-230g', 'Grand Champion Granulate 230g',
     'Balanced staple granulate for discus with carefully selected vitamins, trace elements and animal and plant energy sources — formulated to grow champions. Sizes 80 g / 230 g.',
     1055, 230, 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/grand-champion-granulate.jpg', '20552', 'discus-food'),

    ('for-discus-daily-granulate-230g', 'For Discus Daily Granulate 230g',
     'Balanced complete granulate especially for discus and all granulate-loving fish, with vitamins, minerals, trace elements and probiotics for everyday nutrition. Sizes 80 g / 230 g / 2800 g.',
     833, 230, 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/for-discus-daily-granulate.jpg', '20642', 'discus-food'),

    ('for-discus-daily-granulate-2800g', 'For Discus Daily Granulate 2800g',
     'Balanced complete granulate especially for discus and all granulate-loving fish, with vitamins, minerals, trace elements and probiotics for everyday nutrition. Bulk 2800 g pack.',
     8361, 2800, 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/for-discus-daily-granulate.jpg', '20645', 'discus-food'),

    ('turkey-heart-soft-granulate-230g', 'Turkey Heart Soft Granulate 230g',
     'Soft granulate staple for keepers who want animal protein without beef — only the digestible parts of turkey protein, with much lower water load than frozen turkey heart. Sizes 80 g / 230 g.',
     1088, 230, 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/turkey-heart-soft-granulate.jpg', '20702', 'discus-food'),

    ('wels-special-soft-80g', 'Wels (Catfish) Special Soft Granulate 80g',
     'Fast-sinking soft catfish granulate with molluscs, crustaceans, algae and yeasts to support metabolism, growth and vitality. Soft texture mimics natural prey. Sizes 80 g / 230 g / 550 g.',
     465, 80, 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/wels-special-soft.jpg', '20001', 'discus-food'),

    ('angelfish-special-soft-granulate-230g', 'Angelfish Special Soft Granulate 230g',
     'Soft granulate tuned to angelfish feeding habits and suitable for almost all soft-water fish. 48.8% protein with vitamins, minerals and pre-/probiotics; won''t injure mouths or cloud the water. Sizes 80 g / 230 g / 550 g.',
     1149, 230, 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/angelfish-special-soft-granulate.jpg', '20822', 'discus-food'),

    ('angelfish-special-soft-granulate-550g', 'Angelfish Special Soft Granulate 550g',
     'Soft granulate tuned to angelfish feeding habits and suitable for almost all soft-water fish. 48.8% protein with vitamins, minerals and pre-/probiotics; won''t injure mouths or cloud the water. 550 g pack.',
     2175, 550, 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/angelfish-special-soft-granulate.jpg', '20823', 'discus-food'),

    ('pleco-catfish-algae-wafers-50g', 'Pleco & Catfish Algae Wafers 50g',
     'Extruded sinking wafers for herbivorous plecos and L-catfish that mimic natural aufwuchs (algae growth). Low-heat made so nutrients and vitamins are preserved. Sizes 50 g / 150 g / 480 g.',
     408, 50, 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/pleco-catfish-algae-wafers.png', '23001', 'discus-food'),

    ('pleco-catfish-carni-wafers-50g', 'Pleco & Catfish Carni Wafers 50g',
     'Extruded sinking wafers for carnivorous plecos and L-catfish — protein-rich and mimicking natural aufwuchs. Low-heat made to preserve nutrients. Sizes 50 g / 150 g / 500 g.',
     384, 50, 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/pleco-catfish-carni-wafers.png', '23002', 'discus-food'),

    ('beef-heart-paste-color', 'Beef Heart Paste Color',
     'Ready-to-use beef heart paste enriched with natural colour enhancers — a soft, highly palatable food for conditioning and intensifying warm/red pigmentation. Ideal for hand-feeding and gel feeders.',
     1647, 200, NULL, '20288', 'color-enhancers'),

    ('brine-shrimp-artemia-paste', 'Brine Shrimp / Artemia Paste',
     'Ready-to-use paste made from brine shrimp (Artemia) — a soft, protein-rich food that even demanding and juvenile fish accept eagerly. Ideal for conditioning and gel feeding.',
     1647, 200, NULL, '20289', 'discus-food'),

    ('shrimp-paste', 'Shrimp Paste',
     'Ready-to-use shrimp paste — a soft, aromatic, protein-rich food with natural carotenoids for colour and condition. Highly accepted by discus and other demanding fish.',
     1647, 200, NULL, '20293', 'discus-food'),

    ('natural-humin-5000ml', 'Natural Humin 5000ml',
     'Ultra-pure humic substances that turn tap water into natural soft/black water — bind heavy metals, protect mucous membranes, prevent spawn fungus and create a black-water effect. pH-neutral. Bulk 5000 ml.',
     7290, NULL, 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/natural-humin.png', '25150', 'preparations'),

    ('amazon-tonic-5000ml', 'Amazon Tonic 5000ml',
     'Pure natural extract of South American barks and plants (tannins) for disease prophylaxis — protects mucous membranes, prevents spawn fungus, lowers germ load and does not colour the water. Bulk 5000 ml.',
     7290, NULL, 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/amazon-tonic.png', '25350', 'preparations'),

    ('royal-catappa-5000ml', 'Royal Catappa 5000ml',
     'Powerful 100% natural catappa concentrate with antibacterial and fungicidal action — neutralises bacteria, germs and fungi, protects spawn and mucous membranes. Bulk 5000 ml.',
     7290, NULL, 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/royal-catappa.png', '25550', 'preparations'),

    ('discus-minerals-1000g', 'Discus Minerals 1000g',
     'Balanced minerals and trace elements (no NaCl) to remineralise osmosis/soft water — supports osmoregulation, spawning, growth and stable water. 1 g per 10 L ≈ +3° GH. Sizes 300 g / 1000 g.',
     3330, 1000, 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/discus-minerals.png', '33050', 'supplements')
) AS v(slug, name, description, price_cents, weight_grams, image_url, sku, cat)
JOIN public.categories c ON c.slug = v.cat
ON CONFLICT (slug) DO NOTHING;
