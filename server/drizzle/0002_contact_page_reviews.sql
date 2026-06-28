-- General reviews submitted from the Contact page share the existing review
-- moderation queue. A NULL product_id identifies a general/store review.
ALTER TABLE "reviews" ALTER COLUMN "product_id" DROP NOT NULL;--> statement-breakpoint

ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

DROP POLICY IF EXISTS "Public can read approved general reviews" ON "reviews";--> statement-breakpoint
CREATE POLICY "Public can read approved general reviews"
ON "reviews"
FOR SELECT
TO anon, authenticated
USING ("product_id" IS NULL AND "status" = 'approved');--> statement-breakpoint

DROP POLICY IF EXISTS "Users can submit general reviews" ON "reviews";--> statement-breakpoint
CREATE POLICY "Users can submit general reviews"
ON "reviews"
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = "user_id"
  AND "product_id" IS NULL
  AND "status" = 'pending'
  AND "rating" BETWEEN 1 AND 5
  AND char_length(trim("comment")) BETWEEN 3 AND 1500
  AND char_length(trim(COALESCE("author_name", ''))) BETWEEN 1 AND 100
);
