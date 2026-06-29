-- Customer shipping page reads active rates from the same tables managed by Admin.
-- Inactive zones and methods remain private.
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active shipping zones" ON public.shipping_zones;
CREATE POLICY "Public can view active shipping zones"
  ON public.shipping_zones FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active shipping methods" ON public.shipping_methods;
CREATE POLICY "Public can view active shipping methods"
  ON public.shipping_methods FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
