-- Fill in the product photos that were still missing / low quality after the
-- reseller catalogue import (20260701000000). Images were sourced from the
-- official manufacturer site discusfood.com (higher resolution than the
-- reseller price-list thumbnails) and uploaded to the "product-images" bucket
-- under products/clean/.
--
--   * 7 products that had image_url = NULL:
--       Freshwater Crab ×3 (22060/22062/22063), Herbs Food (20057),
--       Beef Heart Paste Color (20288), Brine Shrimp/Artemia Paste (20289),
--       Shrimp Paste (20293).
--   * 2 products whose existing photo was poor quality — replaced with the
--       manufacturer shot (new "-hq" filename to bypass any CDN caching of the
--       old image): Best Heart Flakes Golden Dream (20044), Pro Breed (20042).
--
-- Keyed by slug so this is idempotent / order-independent.

UPDATE public.products SET image_url =
  'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/freshwater-crab-soft-granulate.jpg',
  updated_at = now() WHERE slug = 'freshwater-crab-soft-granulate';            -- 22060

UPDATE public.products SET image_url =
  'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/freshwater-crab-micro-granulate-soft.jpg',
  updated_at = now() WHERE slug = 'freshwater-crab-micro-granulate-soft';      -- 22062

UPDATE public.products SET image_url =
  'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/freshwater-crab-xl-soft-granulate.jpg',
  updated_at = now() WHERE slug = 'freshwater-crab-xl-soft-granulate';         -- 22063

UPDATE public.products SET image_url =
  'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/herbs-food.png',
  updated_at = now() WHERE slug = 'herbs-food';                                -- 20057

UPDATE public.products SET image_url =
  'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/beef-heart-paste-color.jpg',
  updated_at = now() WHERE slug = 'beef-heart-paste-color';                    -- 20288

UPDATE public.products SET image_url =
  'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/brine-shrimp-artemia-paste.jpg',
  updated_at = now() WHERE slug = 'brine-shrimp-artemia-paste';                -- 20289

UPDATE public.products SET image_url =
  'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/shrimp-paste.jpg',
  updated_at = now() WHERE slug = 'shrimp-paste';                              -- 20293

UPDATE public.products SET image_url =
  'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/best-heart-flakes-golden-dream-hq.webp',
  updated_at = now() WHERE slug = 'best-heart-flakes-golden-dream';            -- 20044

UPDATE public.products SET image_url =
  'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/best-heart-flakes-pro-breed-hq.jpg',
  updated_at = now() WHERE slug = 'best-heart-flakes-pro-breed';              -- 20042
