import { supabase } from './supabase'

export interface ShippingZone {
  id: string
  name: string
  countries: string[]
  is_active: boolean
  /** UPS zone code ('1'…'7', '701') or 'CY' for the domestic zone. */
  zone_code: string | null
  /** Domestic (Cyprus) zones use a flat method price; the rest bill by weight. */
  is_domestic: boolean
  /** Per-kg surcharge applied to weight above the heaviest rate tier. */
  over_kg_cents: number | null
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

/** A billable-weight bracket for a zone: the price for any shipment up to
 *  `max_weight_grams`. Non-domestic (UPS) zones price delivery from these. */
export interface ShippingRateTier {
  id: string
  zone_id: string
  max_weight_grams: number
  price_cents: number
}

export interface ShippingRates {
  zones: ShippingZone[]
  methods: ShippingMethod[]
  tiers: ShippingRateTier[]
}

/**
 * Packaging weight (box + padding) added on top of the net product weight when
 * working out the billable UPS weight. Kept modest; small orders round up into
 * the 0.5 kg minimum bracket anyway. Mirrored in the checkout Edge Function.
 */
export const PACKAGING_TARE_GRAMS = 250

/** Customer-visible rates. These are the same records edited in Admin > Shipping. */
export async function fetchPublicShippingRates(): Promise<ShippingRates> {
  const [zonesResult, methodsResult, tiersResult] = await Promise.all([
    supabase
      .from('shipping_zones')
      .select('id, name, countries, is_active, zone_code, is_domestic, over_kg_cents')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('shipping_methods')
      .select(
        'id, zone_id, name, description, price_cents, free_over_cents, estimated_days_min, estimated_days_max, is_active, sort_order',
      )
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('shipping_rate_tiers')
      .select('id, zone_id, max_weight_grams, price_cents')
      .order('max_weight_grams'),
  ])

  if (zonesResult.error) throw zonesResult.error
  if (methodsResult.error) throw methodsResult.error
  if (tiersResult.error) throw tiersResult.error

  const zones = (zonesResult.data ?? []) as ShippingZone[]
  const activeZoneIds = new Set(zones.map((zone) => zone.id))
  const methods = ((methodsResult.data ?? []) as ShippingMethod[]).filter(
    (method) => method.zone_id === null || activeZoneIds.has(method.zone_id),
  )
  const tiers = ((tiersResult.data ?? []) as ShippingRateTier[]).filter((tier) =>
    activeZoneIds.has(tier.zone_id),
  )

  return { zones, methods, tiers }
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

/** A cart line's contribution to the shipment weight: net product weight × qty. */
export interface WeightLine {
  weightGrams: number | null | undefined
  quantity: number
}

/** Billable UPS weight (grams): summed net product weights + packaging tare. */
export function billableWeightGrams(
  lines: WeightLine[],
  tare = PACKAGING_TARE_GRAMS,
): number {
  const net = lines.reduce(
    (sum, line) => sum + (line.weightGrams ?? 0) * Math.max(0, line.quantity),
    0,
  )
  return net + tare
}

/**
 * Weight-based delivery price for a (non-domestic) UPS zone: the first rate
 * tier whose `max_weight_grams` covers the shipment, or — above the heaviest
 * tier — the top price plus the zone's per-kg surcharge for the excess.
 * Returns null when the zone has no tiers configured.
 */
export function weightBasedCost(
  zone: ShippingZone,
  tiers: ShippingRateTier[],
  grams: number,
): number | null {
  const zoneTiers = tiers
    .filter((tier) => tier.zone_id === zone.id)
    .sort((a, b) => a.max_weight_grams - b.max_weight_grams)
  if (zoneTiers.length === 0) return null

  const covering = zoneTiers.find((tier) => grams <= tier.max_weight_grams)
  if (covering) return covering.price_cents

  const top = zoneTiers[zoneTiers.length - 1]
  const overKg = Math.ceil((grams - top.max_weight_grams) / 1000)
  return top.price_cents + overKg * (zone.over_kg_cents ?? 0)
}

/**
 * Resolved delivery price for a specific method in its zone. Domestic (Cyprus)
 * zones use the flat method price + free-over threshold; UPS zones bill by the
 * shipment's billable weight. Returns null when no price can be determined.
 */
export function methodCost(
  zone: ShippingZone,
  method: ShippingMethod,
  rates: Pick<ShippingRates, 'tiers'>,
  grams: number,
  subtotalCents: number,
): number | null {
  if (zone.is_domestic) return shippingCostFor(method, subtotalCents)
  return weightBasedCost(zone, rates.tiers, grams)
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
