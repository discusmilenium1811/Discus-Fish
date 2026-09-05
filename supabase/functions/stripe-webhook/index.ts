import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

const adminDb = () =>
  createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

// Where the owner's copy of each invoice goes. Falls back to the address already
// printed on the invoice itself (see the checkout function's invoice message).
const OWNER_EMAIL = Deno.env.get('OWNER_EMAIL') ?? 'discusmilenium@outlook.com'
const INVOICE_FROM = Deno.env.get('INVOICE_FROM_EMAIL') ?? 'invoices@discusmileniumcy.com'

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
      const session = event.data.object as Stripe.Checkout.Session
      try {
        await recordOrder(session)
      } finally {
        // Runs even when the order insert failed or was a duplicate: the owner's
        // invoice copy must not depend on it. Never throws (see mirrorInvoice).
        await mirrorSessionInvoice(session)
      }
    } else if (event.type === 'invoice.paid' || event.type === 'invoice.finalized') {
      // Safety net: fills in the PDF/number if the invoice was not yet finalized
      // when the checkout session completed. Enable these events on the endpoint
      // to get it; the flow works on checkout.session.completed alone.
      await mirrorInvoice(event.data.object as Stripe.Invoice, null)
    }
  } catch (err) {
    console.error(`[stripe-webhook] ${event.type} error:`, err)
    // Stripe retries the event, so a transient failure can recover on redelivery.
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// ─────────────────────────────────────────────────────────────────────────────
//  Invoice mirror
//
//  Stripe emails the invoice to the customer and keeps the document. The owner
//  got neither, which left nothing to file for tax. These helpers copy the
//  invoice's summary into public.invoices (for Admin > Invoices) and send the
//  owner Stripe's own PDF — the exact file the customer received, not a
//  re-rendered lookalike.
// ─────────────────────────────────────────────────────────────────────────────

/** Pull the invoice a completed Checkout session generated and mirror it. */
async function mirrorSessionInvoice(session: Stripe.Checkout.Session): Promise<void> {
  const invoiceId =
    typeof session.invoice === 'string' ? session.invoice : session.invoice?.id
  if (!invoiceId) return
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId)
    // The order row was just written by recordOrder (or by an earlier delivery).
    const { data: order } = await adminDb()
      .from('orders')
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle()
    await mirrorInvoice(invoice, (order as { id: string } | null)?.id ?? null)
  } catch (err) {
    console.error('[stripe-webhook] invoice retrieve failed:', invoiceId, err)
  }
}

/**
 * Upsert one Stripe invoice into public.invoices, then send the owner their
 * copy. Idempotent on stripe_invoice_id, and never throws — a failed mirror
 * must not cost us the order.
 */
async function mirrorInvoice(invoice: Stripe.Invoice, orderId: string | null): Promise<void> {
  try {
    // VAT is charged inclusively, so it is already inside `total` and cannot be
    // derived from it. The per-rate breakdown is the only place it is stated.
    const vatCents = (invoice.total_tax_amounts ?? []).reduce(
      (sum, t) => sum + (t.amount ?? 0),
      0,
    )

    const { data, error } = await adminDb()
      .from('invoices')
      .upsert(
        {
          stripe_invoice_id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          customer_name: invoice.customer_name,
          customer_email: invoice.customer_email,
          currency: invoice.currency ?? 'eur',
          subtotal_cents: invoice.subtotal ?? 0,
          vat_cents: vatCents,
          total_cents: invoice.total ?? 0,
          hosted_invoice_url: invoice.hosted_invoice_url,
          invoice_pdf_url: invoice.invoice_pdf,
          issued_at: new Date((invoice.created ?? 0) * 1000).toISOString(),
          // Left out when unknown so a later invoice.paid cannot blank the link
          // an earlier checkout.session.completed already established.
          ...(orderId ? { order_id: orderId } : {}),
        },
        { onConflict: 'stripe_invoice_id' },
      )
      .select('id, owner_emailed_at')
      .single()

    if (error) {
      console.error('[stripe-webhook] invoice upsert failed:', invoice.id, error)
      return
    }

    await emailOwnerCopy(invoice, vatCents, data as { id: string; owner_emailed_at: string | null })
  } catch (err) {
    console.error('[stripe-webhook] invoice mirror failed:', invoice.id, err)
  }
}

/** Base64 for the PDF attachment, chunked so a large buffer cannot blow the stack. */
function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

/** Email the owner Stripe's invoice PDF. No-op until RESEND_API_KEY is set. */
async function emailOwnerCopy(
  invoice: Stripe.Invoice,
  vatCents: number,
  row: { id: string; owner_emailed_at: string | null },
): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  // Without a mail provider the invoice still lands in Admin > Invoices.
  if (!apiKey) return
  if (row.owner_emailed_at) return
  if (invoice.status !== 'paid') return

  const supabase = adminDb()
  // Claim the send before doing it: checkout.session.completed and invoice.paid
  // can arrive together, and Stripe redelivers. Whoever wins the conditional
  // update sends; the loser sees zero rows and stops.
  const { data: claimed } = await supabase
    .from('invoices')
    .update({ owner_emailed_at: new Date().toISOString() })
    .eq('id', row.id)
    .is('owner_emailed_at', null)
    .select('id')
  if (!claimed?.length) return

  try {
    const attachments: Array<{ filename: string; content: string }> = []
    if (invoice.invoice_pdf) {
      const pdf = await fetch(invoice.invoice_pdf)
      if (pdf.ok) {
        attachments.push({
          filename: `invoice-${invoice.number ?? invoice.id}.pdf`,
          content: toBase64(new Uint8Array(await pdf.arrayBuffer())),
        })
      } else {
        console.error('[stripe-webhook] invoice PDF fetch failed:', pdf.status)
      }
    }

    const cur = (invoice.currency ?? 'eur').toUpperCase()
    const money = (c: number) => `${(c / 100).toFixed(2)} ${cur}`
    const total = invoice.total ?? 0
    const label = invoice.number ?? invoice.id
    const row2 = (k: string, v: string, strong = false) =>
      `<tr><td style="padding:4px 12px 4px 0;color:#475569">${k}</td>` +
      `<td style="padding:4px 0;text-align:right;${strong ? 'font-weight:700' : ''}">${v}</td></tr>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: INVOICE_FROM,
        to: [OWNER_EMAIL],
        subject: `Invoice ${label} — ${money(total)} — ${invoice.customer_email ?? 'customer'}`,
        html: `
          <div style="font-family:system-ui,sans-serif;font-size:14px;color:#0f172a">
            <p>A new sale has been invoiced. The PDF attached is the same one the customer received.</p>
            <table style="border-collapse:collapse;margin:16px 0">
              ${row2('Invoice', label)}
              ${row2('Customer', invoice.customer_name ?? '—')}
              ${row2('Email', invoice.customer_email ?? '—')}
              ${row2('Date', new Date((invoice.created ?? 0) * 1000).toISOString().slice(0, 16).replace('T', ' '))}
              ${row2('Net', money(total - vatCents))}
              ${row2('VAT (19% incl.)', money(vatCents))}
              ${row2('Total', money(total), true)}
            </table>
            ${invoice.hosted_invoice_url ? `<p><a href="${invoice.hosted_invoice_url}">View this invoice in Stripe</a></p>` : ''}
          </div>`,
        ...(attachments.length ? { attachments } : {}),
      }),
    })
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
  } catch (err) {
    console.error('[stripe-webhook] owner invoice email failed:', invoice.id, err)
    // Release the claim so a redelivered event can try again.
    await supabase.from('invoices').update({ owner_emailed_at: null }).eq('id', row.id)
  }
}

async function recordOrder(session: Stripe.Checkout.Session) {
  const supabase = adminDb()

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
    // Stripe retries webhook events. A unique violation means this checkout was
    // already saved by an earlier delivery, so there is nothing more to do.
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

