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

  try {
    if (event.type === 'checkout.session.completed') {
      await recordOrder(event.data.object as Stripe.Checkout.Session)
    } else if (
      event.type === 'payment_intent.succeeded' ||
      event.type === 'payment_intent.payment_failed' ||
      event.type === 'payment_intent.processing'
    ) {
      await syncExistingPayment((event.data.object as Stripe.PaymentIntent).id)
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge
      const intentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
      if (intentId) await syncExistingPayment(intentId)
    } else if (
      event.type === 'refund.created' ||
      event.type === 'refund.updated' ||
      event.type === 'refund.failed'
    ) {
      const refund = event.data.object as Stripe.Refund
      const intentId = typeof refund.payment_intent === 'string' ? refund.payment_intent : refund.payment_intent?.id
      if (intentId) await syncExistingPayment(intentId)
    }
  } catch (err) {
    console.error(`[stripe-webhook] ${event.type} error:`, err)
    // A later event or the admin reconciliation action can safely retry the sync.
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

  let contact: Record<string, string> | null = null
  try { contact = session.metadata?.contact ? JSON.parse(session.metadata.contact) : null } catch { /* ignore */ }

  let ship: Record<string, string> | null = null
  try { ship = session.metadata?.ship ? JSON.parse(session.metadata.ship) : null } catch { /* ignore */ }

  let amounts: Record<string, number> | null = null
  try { amounts = session.metadata?.amounts ? JSON.parse(session.metadata.amounts) : null } catch { /* ignore */ }

  const couponCode = session.metadata?.coupon ?? null
  const userId = session.metadata?.userId ?? null

  // Flatten the detailed delivery form into the order's two address lines.
  const join = (...parts: (string | undefined | null)[]) =>
    parts.filter((p) => p && p.trim()).join(', ') || null
  const shipAddress1 = ship ? join(ship.street, ship.building && `Bldg ${ship.building}`) : null
  const shipAddress2 = ship
    ? join(
        ship.floor && `Floor ${ship.floor}`,
        ship.apartment && `Apt ${ship.apartment}`,
        ship.state,
      )
    : null

  // Fetch product snapshots (name + price at time of purchase)
  const ids = cart.map((c) => c.id)
  const { data: products } = ids.length
    ? await supabase
        .from('products')
        .select('id, name, price_cents, stock, track_inventory')
        .in('id', ids)
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
      user_id: userId,
      // Order totals (server-computed in the checkout function).
      subtotal_cents: amounts?.subtotal ?? null,
      shipping_cents: amounts?.shipping ?? null,
      discount_cents: amounts?.discount ?? null,
      tax_cents: amounts?.vat ?? null,
      shipping_method_id: session.metadata?.shipMethodId ?? null,
      // Delivery address from the pre-checkout form.
      ship_name: contact?.fullName || null,
      ship_address1: shipAddress1,
      ship_address2: shipAddress2,
      ship_city: ship?.city || null,
      ship_postal_code: ship?.postalCode || null,
      ship_country: ship?.country || null,
      // Contact / billing snapshot (business billing takes precedence).
      billing_company: billing?.company ?? null,
      billing_vat_number: billing?.vatNumber ?? null,
      billing_registration_number: billing?.registrationNumber || null,
      billing_contact_name: billing?.contactName || contact?.fullName || null,
      billing_phone: billing?.phone || contact?.phone || null,
      billing_email: billing?.email || contact?.email || null,
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
    // Stripe retries webhook events. Reconcile the existing order instead of
    // inserting duplicate items/invoices when this checkout was already saved.
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('orders')
        .select('id, stripe_payment_intent_id')
        .eq('stripe_session_id', session.id)
        .maybeSingle()
      if (existing?.stripe_payment_intent_id) {
        await syncPayment(supabase, existing.id, existing.stripe_payment_intent_id)
      }
      return
    }
    throw error
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null
  if (paymentIntentId) {
    try {
      await syncPayment(supabase, order.id, paymentIntentId)
    } catch (err) {
      console.error('[stripe-webhook] payment ledger sync failed:', err)
    }
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

  // Decrement inventory for tracked products and log the sale movement. This
  // runs only on a fresh order insert (duplicate webhook retries return early
  // above), so stock is never double-counted. Best-effort: never block the order.
  for (const c of cart) {
    const p = byId.get(c.id) as
      | { id: string; stock: number | null; track_inventory: boolean }
      | undefined
    if (!p || !p.track_inventory || p.stock == null) continue
    const next = Math.max(0, p.stock - c.q)
    try {
      await supabase.from('products').update({ stock: next }).eq('id', p.id)
      await supabase.from('stock_movements').insert({
        product_id: p.id,
        change: -c.q,
        reason: 'sale',
        created_by: null,
      })
    } catch (err) {
      console.error('[stripe-webhook] stock update failed:', p.id, err)
    }
  }

  // Mirror the paid order into the admin Invoices section. Best-effort: a
  // failure here must never break order recording. invoice_number and issued_at
  // are generated by the database (same as the admin "New invoice" form).
  try {
    await recordInvoice(supabase, order.id, session)
  } catch (err) {
    console.error('[stripe-webhook] recordInvoice error:', err)
  }

  // Best-effort: count the coupon redemption. Never let this break order recording.
  if (couponCode) {
    try {
      const { data: c } = await supabase
        .from('coupons')
        .select('id, times_redeemed')
        .eq('code', couponCode)
        .maybeSingle()
      if (c) {
        await supabase
          .from('coupons')
          .update({ times_redeemed: ((c as { times_redeemed: number }).times_redeemed ?? 0) + 1 })
          .eq('id', (c as { id: string }).id)
      }
    } catch (err) {
      console.error('[stripe-webhook] coupon redemption update failed:', err)
    }
  }
}

async function syncExistingPayment(paymentIntentId: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle()
  if (order) await syncPayment(supabase, order.id, paymentIntentId)
}

async function syncPayment(
  supabase: ReturnType<typeof createClient>,
  orderId: string,
  paymentIntentId: string,
) {
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ['latest_charge'],
  })
  const charge =
    intent.latest_charge && typeof intent.latest_charge !== 'string'
      ? intent.latest_charge as Stripe.Charge
      : null
  const refunded = charge?.amount_refunded ?? 0
  const received = intent.amount_received || intent.amount
  const status =
    refunded >= received && received > 0
      ? 'refunded'
      : refunded > 0
        ? 'partially_refunded'
        : intent.status === 'succeeded'
          ? 'succeeded'
          : intent.status === 'processing'
            ? 'pending'
            : 'failed'
  const details = charge?.payment_method_details
  const method = details?.card
    ? `${details.card.brand ?? 'card'} •••• ${details.card.last4 ?? ''}`.trim()
    : details?.type ?? intent.payment_method_types?.[0] ?? null

  const { error } = await supabase.from('payments').upsert(
    {
      order_id: orderId,
      stripe_payment_intent_id: intent.id,
      stripe_charge_id: charge?.id ?? null,
      amount_cents: received,
      amount_refunded_cents: refunded,
      currency: intent.currency,
      status,
      method,
    },
    { onConflict: 'stripe_payment_intent_id' },
  )
  if (error) throw error
}

/**
 * Create an admin-panel invoice for a paid order. The DB assigns the
 * invoice_number (INV-1001…) and issued_at, so we only supply the order link,
 * the charged total, and — when Stripe also issued a tax invoice for a business
 * order (invoice_creation) — a link to its official PDF.
 */
async function recordInvoice(
  supabase: ReturnType<typeof createClient>,
  orderId: string,
  session: Stripe.Checkout.Session,
) {
  let pdfUrl: string | null = null
  const invoiceId =
    typeof session.invoice === 'string'
      ? session.invoice
      : (session.invoice as Stripe.Invoice | null)?.id ?? null
  if (invoiceId) {
    try {
      const inv = await stripe.invoices.retrieve(invoiceId)
      pdfUrl = inv.invoice_pdf ?? inv.hosted_invoice_url ?? null
    } catch (err) {
      console.error('[stripe-webhook] invoice retrieve failed:', err)
    }
  }

  await supabase.from('invoices').insert({
    order_id: orderId,
    total_cents: session.amount_total ?? 0,
    currency: session.currency ?? 'eur',
    pdf_url: pdfUrl,
  })
}
