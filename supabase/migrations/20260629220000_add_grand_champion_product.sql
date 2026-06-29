-- The Home showcase offered this product before it had a matching database
-- record, leaving `home-grand-champion-granulate` in customer carts. Give the
-- showcase a canonical product UUID and let Checkout resolve legacy carts by
-- this slug.
insert into public.products (
  slug,
  name,
  description,
  price_cents,
  currency,
  image_url,
  stock,
  is_active,
  is_coming_soon,
  category_id,
  sku,
  track_inventory
)
select
  'grand-champion-granulate',
  'Grand Champion Granulate',
  'Balanced staple granulate for discus with carefully selected vitamins, trace elements and animal and plant energy sources — formulated to grow champions. Sizes 80 g / 230 g.',
  1000,
  'eur',
  'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/products/clean/grand-champion-granulate.jpg',
  100,
  true,
  false,
  c.id,
  'DF-GCG-001',
  true
from public.categories c
where c.slug = 'discus-food'
on conflict (slug) do nothing;
