-- Let signed-in customers submit reviews (Contact-page reviews + product
-- reviews). Submissions are always created as 'pending' so the admin still
-- moderates every review; a user can only write rows tied to their own
-- account and can never self-approve. Public SELECT stays limited to
-- status = 'approved' (unchanged); admin keeps full access via its policy.
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Table-level privilege (RLS still decides which rows): no-op if already granted.
GRANT INSERT ON TABLE public.reviews TO authenticated;

DROP POLICY IF EXISTS reviews_insert_own ON public.reviews;
CREATE POLICY reviews_insert_own
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');
