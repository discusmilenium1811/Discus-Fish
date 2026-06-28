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
      user_id: userId,
      // Order totals (server-computed in the checkout function).
      subtotal_cents: amounts?.subtotal ?? null,
      shipping_cents: amounts?.shipping ?? null,
      discount_cents: amounts?.discount ?? null,
      tax_cents: amounts?.vat ?? null,
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
