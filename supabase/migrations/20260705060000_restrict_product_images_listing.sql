-- Harden the public product-images bucket: stop anonymous users from
-- ENUMERATING/listing every object in it. The storefront shows images through
-- the `/storage/v1/object/public/...` endpoint, which serves public-bucket files
-- WITHOUT consulting storage RLS, so restricting the SELECT policy does not
-- affect image display or catalog downloads at all — it only removes the ability
-- to list the bucket contents. Nothing in the app calls storage .list()/.download()
-- (verified), so admins are unaffected too. Uploads/updates/deletes stay gated by
-- is_admin() via the existing product_images_admin_* policies.
--
-- Before: product_images_public_read granted SELECT to role "public" (incl. anon)
--         for bucket_id = 'product-images' -> anonymous listing was possible.
-- After:  SELECT is limited to admins; the private project-materials bucket and
--         the documents bucket already have no public SELECT policy.

DROP POLICY IF EXISTS product_images_public_read ON storage.objects;

CREATE POLICY product_images_admin_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'product-images' AND is_admin());
