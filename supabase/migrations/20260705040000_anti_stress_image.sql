-- Anti-Stress (31001) had no discusfood.com product page, so it kept a cropped
-- placeholder photo. Replaced with a clean full-bottle shot cut from the official
-- Discusfood 2026 catalogue (Katalog-2026-EN, page 34, the middle of the three
-- bottles), background removed to transparency to match the other product cards,
-- and re-hosted in our Storage. Keyed by slug.

UPDATE public.products SET
  image_url = 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/discusfood/anti-stress.png',
  updated_at = now()
WHERE slug = 'anti-stress';  -- 31001
