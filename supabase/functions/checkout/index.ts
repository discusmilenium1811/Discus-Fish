import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

// Shipping policy — keep in sync with the storefront (src/lib/pricing.ts).
const FREE_SHIPPING_CENTS = 7500 // €75.00
const SHIPPING_FEE_CENTS = 990 // €9.90

function shippingFor(subtotalCents: number) {
  return subtotalCents >= FREE_SHIPPING_CENTS ? 0 : SHIPPING_FEE_CENTS
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

    const { items, userId, email, billing, contact, shipping, couponCode } = body

    if (!Array.isArray(items) || items.length === 0) {
      return json({ error: 'No items' }, 400)
    }

    // Fetch prices from DB — never trust client-supplied prices
    const ids: string[] = items.map((i: { productId: string }) => i.productId)
    const { data: products, error: dbErr } = await supabase
      .from('products')
      .select('id, name, price_cents, currency, is_active')
      .in('id', ids)

    if (dbErr) throw dbErr

    const byId = new Map((products ?? []).map((p) => [p.id, p]))
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    let subtotalCents = 0
    let currency = 'eur'

    for (const item of items) {
      const p = byId.get(item.productId) as { id: string; name: string; price_cents: number; currency: string; is_active: boolean } | undefined
      if (!p || !p.is_active) {
        return json({ error: `Product unavailable: ${item.productId}` }, 400)
      }
      currency = p.currency ?? 'eur'
      subtotalCents += p.price_cents * item.quantity
      lineItems.push({
        price_data: {
          currency,
          unit_amount: p.price_cents,
          product_data: { name: p.name },
        },
        quantity: item.quantity,
      })
    }

    // Delivery — recomputed server-side so it always matches what the cart shows.
    const shippingCents = shippingFor(subtotalCents)
    if (shippingCents > 0) {
      lineItems.push({
        price_data: {
          currency,
          unit_amount: shippingCents,
          product_data: { name: 'Delivery' },
        },
        quantity: 1,
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

    const clientUrl = Deno.env.get('CLIENT_URL') ?? 'https://willowy-nasturtium-e9e6aa.netlify.app'
    const metadata: Record<string, string> = {
      cart: JSON.stringify(items.map((i: { productId: string; quantity: number }) => ({ id: i.productId, q: i.quantity }))),
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
    if (appliedCode) metadata.coupon = appliedCode

    const customerEmail: string | undefined =
      email || contact?.email || billing?.email || undefined

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      ...(discounts.length ? { discounts } : {}),
      payment_intent_data: {
        description: 'Your order has been received and is being processed. Thank you for your order.',
      },
      success_url: `${clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/cart`,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      billing_address_collection: 'required',
      ...(billing
        ? {
            invoice_creation: {
              enabled: true,
              invoice_data: {
                custom_fields: [
                  { name: 'Company', value: billing.company.slice(0, 30) },
                  { name: 'VAT / Tax ID', value: billing.vatNumber.slice(0, 30) },
                ],
                ...(billing.registrationNumber
                  ? { footer: `Company registration: ${billing.registrationNumber}` }
                  : {}),
              },
            },
          }
        : {}),
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
