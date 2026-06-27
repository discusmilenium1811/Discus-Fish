import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) return new Response('Missing stripe-signature', { status: 400 })

  const rawBody = await req.arrayBuffer()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      new Uint8Array(rawBody),
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    console.error('[stripe-webhook] signature error:', message)
    return new Response(`Webhook Error: ${message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    try {
      await recordOrder(event.data.object as Stripe.Checkout.Session)
    } catch (err) {
      console.error('[stripe-webhook] recordOrder error:', err)
      // Return 200 to prevent Stripe from retrying a non-recoverable error.
      // The order can be reconciled manually via the Stripe Dashboard.
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

async function recordOrder(session: Stripe.Checkout.Session) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let cart: Array<{ id: string; q: number }> = []
  try { cart = JSON.parse(session.metadata?.cart ?? '[]') } catch { /* ignore */ }

  let billing: Record<string, string> | null = null
  try { billing = session.metadata?.billing ? JSON.parse(session.metadata.billing) : null } catch { /* ignore */ }

  const userId = session.metadata?.userId ?? null

  // Fetch product snapshots (name + price at time of purchase)
  const ids = cart.map((c) => c.id)
  const { data: products } = ids.length
    ? await supabase.from('products').select('id, name, price_cents').in('id', ids)
    : { data: [] }

  const byId = new Map((products ?? []).map((p) => [p.id, p]))

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      stripe_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null,
      email: session.customer_details?.email ?? null,
      amount_total_cents: session.amount_total ?? 0,
      currency: session.currency ?? 'eur',
      status: 'paid',
      fulfillment_status: 'pending',
      user_id: userId,
      billing_company: billing?.company ?? null,
      billing_vat_number: billing?.vatNumber ?? null,
      billing_registration_number: billing?.registrationNumber || null,
      billing_contact_name: billing?.contactName || null,
      billing_phone: billing?.phone || null,
      billing_email: billing?.email || null,
      billing_address1: billing?.address1 || null,
      billing_address2: billing?.address2 || null,
      billing_city: billing?.city || null,
      billing_state: billing?.state || null,
      billing_postal_code: billing?.postalCode || null,
      billing_country: billing?.country || null,
    })
    .select('id')
    .single()

  if (error) {
    // 23505 = unique_violation (duplicate webhook delivery) — safe to ignore
    if (error.code === '23505') return
    throw error
  }

  const lineRows = cart
    .map((c) => {
      const p = byId.get(c.id) as { id: string; name: string; price_cents: number } | undefined
      if (!p) return null
      return {
        order_id: order.id,
        product_id: p.id,
        name: p.name,
        unit_price_cents: p.price_cents,
        quantity: c.q,
      }
    })
    .filter(Boolean)

  if (lineRows.length) {
    await supabase.from('order_items').insert(lineRows)
  }
}
