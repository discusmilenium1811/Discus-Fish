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

export interface FreeShippingThresholds {
  cyprusCents: number
  euCents: number
}

export const DEFAULT_FREE_SHIPPING_THRESHOLDS: FreeShippingThresholds = {
  cyprusCents: 4000,
  euCents: 7500,
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

/** Reads the lowest active free-shipping threshold for Cyprus and the EU. */
export async function fetchFreeShippingThresholds(): Promise<FreeShippingThresholds> {
  const { zones, methods } = await fetchPublicShippingRates()
  const cyprusZone = zones.find(
    (zone) => zone.countries.includes('CY') || zone.name.toLowerCase().includes('cyprus'),
  )
  const euZone = zones.find(
    (zone) =>
      zone.name.toLowerCase().includes('european union') ||
      (zone.countries.includes('DE') && zone.countries.includes('FR')),
  )

  const thresholdFor = (zoneId?: string) => {
    if (!zoneId) return null
    const thresholds = methods
      .filter((method) => method.zone_id === zoneId && method.free_over_cents != null)
      .map((method) => method.free_over_cents as number)
    return thresholds.length ? Math.min(...thresholds) : null
  }

  return {
    cyprusCents: thresholdFor(cyprusZone?.id) ?? DEFAULT_FREE_SHIPPING_THRESHOLDS.cyprusCents,
    euCents: thresholdFor(euZone?.id) ?? DEFAULT_FREE_SHIPPING_THRESHOLDS.euCents,
  }
}
