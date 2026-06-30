// Home-page photography lives permanently in Supabase Storage (the same public
// `product-images` bucket as the product shots), under the `home/` prefix, so
// the imagery survives for the life of the site and isn't tied to the build.
// Available files: hero-discus, discus-portrait, discus-school, planted-tank,
// aquascape, discus-red, fish-plants (all .jpg).
export const HOME_IMG =
  'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images/home'
