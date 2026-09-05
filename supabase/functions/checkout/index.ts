import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

// ─────────────────────────────────────────────────────────────────────────
//  Delivery is driven entirely by the admin-managed shipping_zones /
//  shipping_methods tables — the same records the owner edits in Admin >
//  Shipping and that the storefront reads (src/lib/shipping.ts). This mirrors
//  that exact resolution server-side so the charge always matches the cart.
// ─────────────────────────────────────────────────────────────────────────

const WORLDWIDE = 'WORLDWIDE'
// Packaging weight added to the net product weight for the billable UPS weight.
// Must match PACKAGING_TARE_GRAMS in src/lib/shipping.ts so the charge equals the cart.
const PACKAGING_TARE_GRAMS = 250

// ─────────────────────────────────────────────────────────────────────────
//  Invoicing
//
//  Stripe renders the invoice PDF and its emails in the *customer's*
//  preferred_locales, which it otherwise infers from the buyer's browser —
//  that is how invoices ended up in Russian. Pinning the locale on the
//  customer (and on Checkout itself) keeps every invoice in English.
//
//  Stripe also prints a tax line only when the line items carry a tax rate.
//  Catalog prices already include VAT (see src/lib/pricing.ts), so the rate is
//  registered as *inclusive*: the totals do not change, but the invoice now
//  shows "VAT (19% inclusive)" with the contained amount instead of leaving
//  the customer to work it out.
// ─────────────────────────────────────────────────────────────────────────

const INVOICE_LOCALE = 'en'
const VAT_PERCENTAGE = 19

let cachedVatTaxRateId: string | null = null

/** The Cyprus 19% VAT-inclusive rate, looked up once and then reused. */
async function getVatTaxRateId(): Promise<string | null> {
  if (cachedVatTaxRateId) return cachedVatTaxRateId
  const configured = Deno.env.get('STRIPE_VAT_TAX_RATE_ID')
  if (configured) {
    cachedVatTaxRateId = configured
    return cachedVatTaxRateId
  }
  try {
    // Tax rates are immutable in Stripe, so a rate change means a new record:
    // match on the exact percentage rather than on a fixed id.
    const existing = await stripe.taxRates.list({ active: true, inclusive: true, limit: 100 })
    const match = existing.data.find(
      (r) => Number(r.percentage) === VAT_PERCENTAGE && r.country === 'CY',
    )
    cachedVatTaxRateId =
      match?.id ??
      (
        await stripe.taxRates.create({
          display_name: 'VAT',
          description: 'Cyprus VAT',
          jurisdiction: 'Cyprus',
          country: 'CY',
          percentage: VAT_PERCENTAGE,
          inclusive: true,
          tax_type: 'vat',
        })
      ).id
    return cachedVatTaxRateId
  } catch (err) {
    // Never block a sale on this: worst case the invoice loses its VAT line.
    console.error('[checkout] VAT tax rate unavailable:', err)
    return null
  }
}

/**
 * Reuse (or create) the buyer's Stripe customer with English pinned, so the
 * generated invoice is never rendered in whatever language their browser
 * happens to be set to. Returns null when Stripe is unreachable, in which case
 * checkout falls back to plain `customer_email`.
 */
async function resolveCustomerId(email: string): Promise<string | null> {
  try {
    const { data } = await stripe.customers.list({ email, limit: 1 })
    const existing = data[0]
    if (!existing) {
      const created = await stripe.customers.create({
        email,
        preferred_locales: [INVOICE_LOCALE],
      })
      return created.id
    }
    const locales = existing.preferred_locales ?? []
    if (locales.length !== 1 || locales[0] !== INVOICE_LOCALE) {
      await stripe.customers.update(existing.id, { preferred_locales: [INVOICE_LOCALE] })
    }
    return existing.id
  } catch (err) {
    console.error('[checkout] customer lookup failed:', err)
    return null
  }
}

interface ZoneRow {
  id: string
  name: string
  countries: string[]
  is_active: boolean
  is_domestic: boolean
  over_kg_cents: number | null
}
interface MethodRow {
  id: string
  zone_id: string
  name: string
  price_cents: number
  free_over_cents: number | null
  free_under_grams: number | null
  over_weight_price_cents: number | null
  is_active: boolean
  sort_order: number
}
interface TierRow {
  zone_id: string
  max_weight_grams: number
  price_cents: number
}

/** Active zone serving a country; empty-countries zone is the worldwide fallback. */
function resolveZone(zones: ZoneRow[], country: string): ZoneRow | null {
  const code = (country ?? '').trim().toUpperCase()
  const active = zones.filter((z) => z.is_active)
  if (code && code !== WORLDWIDE) {
    const specific = active.find((z) => z.countries.some((c) => c.toUpperCase() === code))
    if (specific) return specific
  }
  return active.find((z) => z.countries.length === 0) ?? null
}

/** Weight-based price for a non-domestic zone from its rate tiers (mirrors the cart). */
function weightBasedCost(zone: ZoneRow, tiers: TierRow[], grams: number): number | null {
  const zoneTiers = tiers
    .filter((t) => t.zone_id === zone.id)
    .sort((a, b) => a.max_weight_grams - b.max_weight_grams)
  if (zoneTiers.length === 0) return null
  const covering = zoneTiers.find((t) => grams <= t.max_weight_grams)
  if (covering) return covering.price_cents
  const top = zoneTiers[zoneTiers.length - 1]
  const overKg = Math.ceil((grams - top.max_weight_grams) / 1000)
  return top.price_cents + overKg * (zone.over_kg_cents ?? 0)
}

/** Recompute the delivery line for a country + chosen method straight from the DB. */
async function resolveShipping(
  supabase: ReturnType<typeof createClient>,
  country: string,
  methodId: string | undefined,
  netGrams: number,
  shipmentGrams: number,
): Promise<{ cents: number; name: string; methodId: string } | { error: string }> {
  const [zonesRes, methodsRes, tiersRes] = await Promise.all([
    supabase
      .from('shipping_zones')
      .select('id, name, countries, is_active, is_domestic, over_kg_cents')
      .eq('is_active', true),
    supabase
      .from('shipping_methods')
      .select('id, zone_id, name, price_cents, free_over_cents, free_under_grams, over_weight_price_cents, is_active, sort_order')
      .eq('is_active', true),
    supabase.from('shipping_rate_tiers').select('zone_id, max_weight_grams, price_cents'),
  ])
  const zone = resolveZone((zonesRes.data ?? []) as unknown as ZoneRow[], country)
  if (!zone) return { error: 'We do not ship to this destination yet.' }
  const zoneMethods = ((methodsRes.data ?? []) as unknown as MethodRow[])
    .filter((m) => m.zone_id === zone.id)
    .sort((a, b) => a.sort_order - b.sort_order || a.price_cents - b.price_cents)
  if (zoneMethods.length === 0)
    return { error: 'No delivery option is available for this destination.' }
  // Honour the customer's pick, but only if it's a valid method for the zone.
  const chosen =
    (methodId ? zoneMethods.find((m) => m.id === methodId) : undefined) ?? zoneMethods[0]

  // Domestic (Cyprus / AKIS) prices by net product weight: free under the method's
  // threshold (office-to-office), a flat over-weight fee, or a plain flat price
  // (home delivery). UPS zones bill by billable weight. No amount-based free shipping.
  let cents: number
  if (zone.is_domestic) {
    if (chosen.free_under_grams != null) {
      cents =
        netGrams <= chosen.free_under_grams
          ? 0
          : chosen.over_weight_price_cents ?? chosen.price_cents
    } else {
      cents = chosen.price_cents
    }
  } else {
    const tiers = (tiersRes.data ?? []) as unknown as TierRow[]
    const cost = weightBasedCost(zone, tiers, shipmentGrams)
    if (cost == null)
      return { error: 'No delivery rate is available for this destination.' }
    cents = cost
  }
  return { cents, name: chosen.name, methodId: chosen.id }
}

interface CouponRow {
  id: string
  code: string
  discount_type: 'percent' | 'fixed'
  value: number
  min_order_cents: number
  max_redemptions: number | null
  times_redeemed: number
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
}

/**
 * Look up a coupon and decide whether it applies to the given subtotal.
 * Returns the discount in cents (capped at the subtotal) plus a reason when invalid.
 */
async function evaluateCoupon(
  supabase: ReturnType<typeof createClient>,
  rawCode: string,
  subtotalCents: number,
): Promise<{ valid: boolean; discountCents: number; code?: string; message?: string }> {
  const code = (rawCode ?? '').trim().toUpperCase()
  if (!code) return { valid: false, discountCents: 0, message: 'Enter a coupon code.' }

  const { data, error } = await supabase
    .from('coupons')
    .select(
      'id, code, discount_type, value, min_order_cents, max_redemptions, times_redeemed, starts_at, expires_at, is_active',
    )
    .eq('code', code)
    .maybeSingle()

  if (error) return { valid: false, discountCents: 0, message: 'Could not check coupon.' }
  const c = data as CouponRow | null
  if (!c || !c.is_active) return { valid: false, discountCents: 0, message: 'This coupon code is not valid.' }

  const now = Date.now()
  if (c.starts_at && new Date(c.starts_at).getTime() > now)
    return { valid: false, discountCents: 0, message: 'This coupon is not active yet.' }
  if (c.expires_at && new Date(c.expires_at).getTime() < now)
    return { valid: false, discountCents: 0, message: 'This coupon has expired.' }
  if (c.max_redemptions != null && c.times_redeemed >= c.max_redemptions)
    return { valid: false, discountCents: 0, message: 'This coupon has reached its limit.' }
  if (subtotalCents < (c.min_order_cents ?? 0))
    return {
      valid: false,
      discountCents: 0,
      message: `Minimum order of €${((c.min_order_cents ?? 0) / 100).toFixed(2)} required.`,
    }

  const raw =
    c.discount_type === 'percent'
      ? Math.round((subtotalCents * c.value) / 100)
      : c.value // fixed coupons store the amount in cents
  const discountCents = Math.max(0, Math.min(raw, subtotalCents))
  return { valid: true, discountCents, code: c.code }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const body = await req.json()

    // Lightweight endpoint used by the cart to preview a coupon before paying.
    if (body?.action === 'validate-coupon') {
      const result = await evaluateCoupon(
        supabase,
        body.code ?? '',
        Number(body.subtotalCents) || 0,
      )
      return json(result)
    }

    const { items, userId, email, billing, contact, shipping, shippingMethodId, couponCode } = body

    if (!Array.isArray(items) || items.length === 0) {
      return json({ error: 'No items' }, 400)
    }

    // Decide the price tier from the AUTHENTICATED caller, never the body userId
    // (wholesale prices are lower, so a spoofed id must not underprice the cart).
    // Only an approved business account gets wholesale prices.
    let approvedBusiness = false
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (token) {
      const { data: userData } = await supabase.auth.getUser(token)
      if (userData?.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('account_type, business_status')
          .eq('id', userData.user.id)
          .maybeSingle()
        approvedBusiness =
          prof?.account_type === 'business' && prof?.business_status === 'approved'
      }
    }

    // Fetch prices + availability from DB — never trust client-supplied prices.
    const requestedIds: string[] = items.map((i: { productId: string }) => i.productId)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const uuidIds = requestedIds.filter((id) => uuidPattern.test(id))
    // Older Home showcase carts used `home-<slug>` as a temporary identifier.
    // Resolve those entries by slug so an existing cart remains checkout-safe.
    const legacySlugs = requestedIds
      .filter((id) => id.startsWith('home-'))
      .map((id) => id.slice(5))
      .filter((slug) => /^[a-z0-9-]+$/.test(slug))
    const productColumns =
      'id, slug, name, price_cents, business_price_cents, currency, is_active, is_coming_soon, stock, track_inventory, weight_grams'
    const [uuidProducts, slugProducts] = await Promise.all([
      uuidIds.length
        ? supabase.from('products').select(productColumns).in('id', uuidIds)
        : Promise.resolve({ data: [], error: null }),
      legacySlugs.length
        ? supabase.from('products').select(productColumns).in('slug', legacySlugs)
        : Promise.resolve({ data: [], error: null }),
    ])
    if (uuidProducts.error) throw uuidProducts.error
    if (slugProducts.error) throw slugProducts.error

    const products = [...(uuidProducts.data ?? []), ...(slugProducts.data ?? [])]
    const byId = new Map<string, (typeof products)[number]>()
    for (const product of products) {
      byId.set(product.id, product)
      byId.set(`home-${product.slug}`, product)
    }
    // Every line (goods and delivery alike) carries the inclusive VAT rate so
    // Stripe breaks the tax out on the invoice instead of hiding it in the total.
    const vatTaxRateId = await getVatTaxRateId()
    const taxRates = vatTaxRateId ? { tax_rates: [vatTaxRateId] } : {}

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    const canonicalCart: Array<{ id: string; q: number }> = []
    let subtotalCents = 0
    let netGrams = 0
    let currency = 'eur'

    for (const item of items) {
      const p = byId.get(item.productId) as
        | { id: string; name: string; price_cents: number; business_price_cents: number | null; currency: string; is_active: boolean; is_coming_soon: boolean; stock: number | null; track_inventory: boolean; weight_grams: number | null }
        | undefined
      // Only sell products that are active and not still "coming soon".
      if (!p || !p.is_active || p.is_coming_soon) {
        return json({ error: `Product unavailable: ${item.productId}` }, 400)
      }
      const qty = Number(item.quantity)
      if (!Number.isInteger(qty) || qty < 1) {
        return json({ error: `Invalid quantity for ${p.name}` }, 400)
      }
      // Block overselling when the product tracks inventory.
      if (p.track_inventory && p.stock != null && p.stock < qty) {
        return json({ error: `Not enough stock for ${p.name}` }, 400)
      }
      // Approved business accounts pay wholesale; everyone else pays retail.
      const unitPrice =
        approvedBusiness && p.business_price_cents != null
          ? p.business_price_cents
          : p.price_cents
      currency = p.currency ?? 'eur'
      subtotalCents += unitPrice * qty
      netGrams += (p.weight_grams ?? 0) * qty
      canonicalCart.push({ id: p.id, q: qty })
      lineItems.push({
        price_data: {
          currency,
          unit_amount: unitPrice,
          product_data: { name: p.name },
        },
        quantity: qty,
        ...taxRates,
      })
    }

    // Delivery — recomputed server-side from the admin rates so it always
    // matches what the cart shows (and can't be tampered with by the client).
    const shippingResult = await resolveShipping(
      supabase,
      shipping?.country ?? '',
      shippingMethodId,
      netGrams,
      netGrams + PACKAGING_TARE_GRAMS,
    )
    if ('error' in shippingResult) {
      return json({ error: shippingResult.error }, 400)
    }
    const shippingCents = shippingResult.cents
    if (shippingCents > 0) {
      lineItems.push({
        price_data: {
          currency,
          unit_amount: shippingCents,
          product_data: { name: `Delivery — ${shippingResult.name}` },
        },
        quantity: 1,
        ...taxRates,
      })
    }

    // Coupon — re-validated here (client value is never trusted).
    let discountCents = 0
    let appliedCode: string | undefined
    const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = []
    if (couponCode) {
      const result = await evaluateCoupon(supabase, couponCode, subtotalCents)
      if (result.valid && result.discountCents > 0) {
        discountCents = result.discountCents
        appliedCode = result.code
        // A one-off Stripe coupon for the exact computed amount keeps the
        // charged total equal to the breakdown regardless of percent/fixed.
        const stripeCoupon = await stripe.coupons.create({
          amount_off: discountCents,
          currency,
          duration: 'once',
          name: appliedCode,
        })
        discounts.push({ coupon: stripeCoupon.id })
      }
    }

    const totalCents = Math.max(0, subtotalCents - discountCents) + shippingCents
    // VAT is included in the prices; this is the portion contained in the total.
    const vatCents = Math.round(totalCents - totalCents / 1.19)

    // Send the buyer back to the storefront that started checkout: local dev
    // returns to localhost, production returns to the live site. Unknown origins
    // fall back to CLIENT_URL so this can't be abused as an open redirect.
    //
    // CLIENT_URL is the canonical domain (no `www`). The `www` host is accepted
    // too, so a buyer who somehow started checkout there is not bounced across
    // domains after paying. Everything else falls back to the canonical origin.
    const fallbackUrl = Deno.env.get('CLIENT_URL') ?? 'https://discusmileniumcy.com'
    const origin = req.headers.get('origin') ?? ''
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    const isCanonical = origin === fallbackUrl || origin === fallbackUrl.replace('://', '://www.')
    const clientUrl = isLocalhost || isCanonical ? origin : fallbackUrl
    const metadata: Record<string, string> = {
      cart: JSON.stringify(canonicalCart),
      amounts: JSON.stringify({
        subtotal: subtotalCents,
        shipping: shippingCents,
        discount: discountCents,
        vat: vatCents,
        total: totalCents,
      }),
    }
    if (userId) metadata.userId = userId
    if (billing) metadata.billing = JSON.stringify(billing)
    if (contact) metadata.contact = JSON.stringify(contact)
    if (shipping) metadata.ship = JSON.stringify(shipping)
    metadata.shipMethodId = shippingResult.methodId
    if (appliedCode) metadata.coupon = appliedCode

    const customerEmail: string | undefined =
      email || contact?.email || billing?.email || undefined
    // Attaching a customer with preferred_locales = ["en"] is what forces the
    // invoice PDF and Stripe's emails into English.
    const customerId = customerEmail ? await resolveCustomerId(customerEmail) : null
    const invoiceMessage = [
      'Hello,',
      'Thank you for your purchase from Discusfood.',
      '',
      'Attached to this email you will find your payment invoice.',
      'If you have any questions about your order, you can contact us.',
      '',
      'Regards,',
      'discusmilenium@outlook.com',
    ].join('\n')

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      ...(discounts.length ? { discounts } : {}),
      payment_intent_data: {
        description: 'Your order has been received and is being processed. Thank you for your order.',
      },
      success_url: `${clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/cart`,
      // Pin Checkout to English too, so Stripe cannot fall back to the browser
      // locale for the customer record it touches during the session.
      locale: INVOICE_LOCALE,
      ...(customerId
        ? {
            customer: customerId,
            // Without this the invoice would bill to the customer's stored
            // address rather than the one collected at Checkout.
            customer_update: { address: 'auto', name: 'auto' },
          }
        : customerEmail
          ? { customer_email: customerEmail }
          : {}),
      billing_address_collection: 'required',
      // Generate a paid Stripe Invoice for every successful one-time Checkout
      // payment. When "Successful payments" is enabled in Stripe's customer
      // email settings, Stripe emails the customer an invoice summary with the
      // downloadable invoice PDF. Business details are added when available.
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: invoiceMessage,
          ...(billing
            ? {
                custom_fields: [
                  { name: 'Company', value: billing.company.slice(0, 30) },
                  { name: 'VAT / Tax ID', value: billing.vatNumber.slice(0, 30) },
                ],
                ...(billing.registrationNumber
                  ? { footer: `Company registration: ${billing.registrationNumber}` }
                  : {}),
              }
            : {}),
        },
      },
      metadata,
    })

    return json({ id: session.id, url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    console.error('[checkout]', err)
    return json({ error: message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
