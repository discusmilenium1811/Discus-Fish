-- UPS-style customer delivery tracking backed by the existing orders/shipments tables.
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'label_created',
  ADD COLUMN IF NOT EXISTS status_detail text,
  ADD COLUMN IF NOT EXISTS last_location text,
  ADD COLUMN IF NOT EXISTS estimated_delivery_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.shipments
SET status = CASE
  WHEN delivered_at IS NOT NULL THEN 'delivered'
  WHEN shipped_at IS NOT NULL THEN 'on_the_way'
  ELSE 'label_created'
END
WHERE status IS NULL OR status = '';

CREATE TABLE IF NOT EXISTS public.tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'label_created',
  description text,
  location text,
  event_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tracking_events
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'label_created',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS event_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS shipments_order_idx ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS shipments_status_idx ON public.shipments(status);
CREATE INDEX IF NOT EXISTS tracking_events_shipment_idx ON public.tracking_events(shipment_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own delivery orders" ON public.orders;
CREATE POLICY "Customers can view own delivery orders"
  ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Customers can view own shipments" ON public.shipments;
CREATE POLICY "Customers can view own shipments"
  ON public.shipments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = shipments.order_id
        AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Customers can view own tracking events" ON public.tracking_events;
CREATE POLICY "Customers can view own tracking events"
  ON public.tracking_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.shipments
      JOIN public.orders ON orders.id = shipments.order_id
      WHERE shipments.id = tracking_events.shipment_id
        AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage tracking events" ON public.tracking_events;
CREATE POLICY "Admins can manage tracking events"
  ON public.tracking_events FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

GRANT SELECT ON public.orders, public.shipments, public.tracking_events TO authenticated;

-- Realtime makes admin updates appear immediately; the UI also polls as a fallback.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'shipments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tracking_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_events;
  END IF;
END $$;
