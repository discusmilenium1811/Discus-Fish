-- New transparent product photos supplied for the 500 ml product cards.
-- Versioned filenames bypass stale CDN copies of the previous images.

UPDATE public.products SET
  image_url = 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/discusfood/natural-humin-v2.png',
  updated_at = now()
WHERE slug = 'natural-humin';

UPDATE public.products SET
  image_url = 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/discusfood/anti-tox-v2.png',
  updated_at = now()
WHERE slug = 'anti-tox';

UPDATE public.products SET
  image_url = 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/discusfood/catappa-royal-v2.png',
  updated_at = now()
WHERE slug = 'royal-catappa';

-- Use the supplied 500 ml photo for the 5000 ml card as well, because no
-- better photo is currently available for the larger container.
UPDATE public.products SET
  image_url = 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/discusfood/catappa-royal-v2.png',
  updated_at = now()
WHERE slug = 'royal-catappa-5000ml';
