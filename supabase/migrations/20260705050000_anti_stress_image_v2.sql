-- The first Anti-Stress catalogue crop (20260705040000) clipped the bottle's
-- rounded base at the bottom. Re-cropped from Katalog-2026-EN page 34 to include
-- the full bottle base, background removed to transparency, uploaded under a new
-- filename to bypass CDN caching of the old crop. Keyed by slug.

UPDATE public.products SET
  image_url = 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/discusfood/anti-stress-v2.png',
  updated_at = now()
WHERE slug = 'anti-stress';  -- 31001
