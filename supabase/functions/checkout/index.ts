import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { items, userId, email, billing } = await req.json()

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

    for (const item of items) {
      const p = byId.get(item.productId) as { id: string; name: string; price_cents: number; currency: string; is_active: boolean } | undefined
      if (!p || !p.is_active) {
        return json({ error: `Product unavailable: ${item.productId}` }, 400)
      }
      lineItems.push({
        price_data: {
          currency: p.currency ?? 'eur',
          unit_amount: p.price_cents,
          product_data: { name: p.name },
        },
        quantity: item.quantity,
      })
    }

    const clientUrl = Deno.env.get('CLIENT_URL') ?? 'https://willowy-nasturtium-e9e6aa.netlify.app'
    const metadata: Record<string, string> = {
      cart: JSON.stringify(items.map((i: { productId: string; quantity: number }) => ({ id: i.productId, q: i.quantity }))),
    }
    if (userId) metadata.userId = userId
    if (billing) metadata.billing = JSON.stringify(billing)

    const customerEmail: string | undefined = email || billing?.email || undefined

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
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
