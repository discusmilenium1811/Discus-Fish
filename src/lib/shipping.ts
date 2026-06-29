import { supabase } from './supabase'

export interface ShippingZone {
  id: string
  name: string
  countries: string[]
  is_active: boolean
}

export interface ShippingMethod {
  id: string
  zone_id: string | null
  name: string
  description: string
  price_cents: number
  free_over_cents: number | null
  estimated_days_min: number | null
  estimated_days_max: number | null
  is_active: boolean
  sort_order: number
}

export interface ShippingRates {
  zones: ShippingZone[]
  methods: ShippingMethod[]
}

/** Customer-visible rates. These are the same records edited in Admin > Shipping. */
export async function fetchPublicShippingRates(): Promise<ShippingRates> {
  const [zonesResult, methodsResult] = await Promise.all([
    supabase
      .from('shipping_zones')
      .select('id, name, countries, is_active')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('shipping_methods')
      .select(
        'id, zone_id, name, description, price_cents, free_over_cents, estimated_days_min, estimated_days_max, is_active, sort_order',
      )
      .eq('is_active', true)
      .order('sort_order'),
  ])

  if (zonesResult.error) throw zonesResult.error
  if (methodsResult.error) throw methodsResult.error

  const zones = (zonesResult.data ?? []) as ShippingZone[]
  const activeZoneIds = new Set(zones.map((zone) => zone.id))
  const methods = ((methodsResult.data ?? []) as ShippingMethod[]).filter(
    (method) => method.zone_id === null || activeZoneIds.has(method.zone_id),
  )

  return { zones, methods }
}

// ─────────────────────────────────────────────────────────────────────────
//  Shipping resolution — the single source of truth for which rate applies.
//  The checkout Edge Function mirrors this exact logic server-side so the
//  amount charged always equals what the cart shows. Everything is driven by
//  the admin-managed shipping_zones / shipping_methods tables, so any change
//  the owner makes in Admin > Shipping flows through to the cart and checkout.
// ─────────────────────────────────────────────────────────────────────────

/** Sentinel country value for the "rest of the world" fallback zone. */
export const WORLDWIDE = 'WORLDWIDE'

/**
 * Find the active zone that serves a country code. A specific zone (one that
 * lists the country) always wins; otherwise the empty-countries zone acts as
 * the worldwide fallback. Returns null when nothing serves the country.
 */
export function resolveZone(zones: ShippingZone[], country: string): ShippingZone | null {
  const code = country.trim().toUpperCase()
  const active = zones.filter((zone) => zone.is_active)
  if (code && code !== WORLDWIDE) {
    const specific = active.find((zone) =>
      zone.countries.some((c) => c.toUpperCase() === code),
    )
    if (specific) return specific
  }
  // Empty-countries zone = "Rest of world" fallback.
  return active.find((zone) => zone.countries.length === 0) ?? null
}

/** Active shipping methods for a country's zone, cheapest/first listed first. */
export function methodsForCountry(rates: ShippingRates, country: string): ShippingMethod[] {
  const zone = resolveZone(rates.zones, country)
  if (!zone) return []
  return rates.methods
    .filter((method) => method.is_active && method.zone_id === zone.id)
    .sort((a, b) => a.sort_order - b.sort_order || a.price_cents - b.price_cents)
}

/** Delivery cost for a chosen method given the goods subtotal (free over threshold). */
export function shippingCostFor(method: ShippingMethod, subtotalCents: number): number {
  if (method.free_over_cents != null && subtotalCents >= method.free_over_cents) return 0
  return method.price_cents
}

export interface CheckoutCountry {
  code: string
  zoneId: string
}

/**
 * Countries offered at checkout, derived straight from the admin zones so the
 * dropdown stays in sync with whatever the owner configures. The worldwide
 * fallback (empty-countries zone) is surfaced separately via {@link WORLDWIDE}.
 */
export function checkoutCountries(zones: ShippingZone[]): CheckoutCountry[] {
  const seen = new Map<string, string>()
  zones
    .filter((zone) => zone.is_active)
    .forEach((zone) =>
      zone.countries.forEach((c) => {
        const code = c.toUpperCase()
        if (!seen.has(code)) seen.set(code, zone.id)
      }),
    )
  return [...seen.entries()].map(([code, zoneId]) => ({ code, zoneId }))
}

/** True when an active worldwide (empty-countries) fallback zone exists. */
export function hasWorldwideZone(zones: ShippingZone[]): boolean {
  return zones.some((zone) => zone.is_active && zone.countries.length === 0)
}
