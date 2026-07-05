-- Revert ONLY the water-conditioner products (category "preparations") from the
-- transparent-background PNGs back to their original white-background discusfood
-- photos. On the storefront the glass/liquid bottles looked better on their
-- original white studio background than with the background flood-filled to
-- transparency, so per the client we undo the 20260705020000 change for these
-- 7 products (Natural Humin, Amazon Tonic, Anti Tox, Royal Catappa). The other
-- water-care items (Bacto, Anti-Stress, Discus Protector) were never
-- transparency-processed and keep their current images. Keyed by slug.

UPDATE public.products SET image_url = 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/discusfood/natural-humin.jpg', updated_at = now() WHERE slug = 'natural-humin';         -- 25105
UPDATE public.products SET image_url = 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/discusfood/natural-humin.jpg', updated_at = now() WHERE slug = 'natural-humin-5000ml';   -- 25150
UPDATE public.products SET image_url = 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/discusfood/amazon-tonic.jpg',  updated_at = now() WHERE slug = 'amazon-tonic';          -- 25305
UPDATE public.products SET image_url = 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/discusfood/amazon-tonic.jpg',  updated_at = now() WHERE slug = 'amazon-tonic-5000ml';    -- 25350
UPDATE public.products SET image_url = 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/discusfood/anti-tox.jpg',      updated_at = now() WHERE slug = 'anti-tox';              -- 25405
UPDATE public.products SET image_url = 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/discusfood/catappa-royal.jpg', updated_at = now() WHERE slug = 'royal-catappa';          -- 25505
UPDATE public.products SET image_url = 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/discusfood/catappa-royal.jpg', updated_at = now() WHERE slug = 'royal-catappa-5000ml';    -- 25550
