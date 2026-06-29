-- Enable the Contact-page "leave a review" feature without weakening product
-- reviews. Product reviews stay verified-buyer-only (policy reviews_owner_insert
-- requires a paid order). Contact-page reviews are testimonials about the shop
-- (no purchase) and are tagged with a '[[contact-review]]' comment prefix by
-- src/lib/api.ts submitContactReview — this policy admits exactly those:
-- signed-in author, always created 'pending' for admin moderation, never
-- self-approved, only the user's own rows.
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reviews_contact_insert ON public.reviews;
CREATE POLICY reviews_contact_insert
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND comment LIKE '[[contact-review]]%'
  );
