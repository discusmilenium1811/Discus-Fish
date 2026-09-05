// ─────────────────────────────────────────────────────────────────────────────
//  Invoice mirror — shared by stripe-webhook (live) and sync-invoices (backfill).
//
//  Stripe remains the system of record. This copies an invoice's summary into
//  public.invoices and keeps Stripe's own hosted/PDF URLs, so the document the
//  owner opens or receives is the exact file the customer got — never a
//  re-rendered lookalike. Both callers share this so the money mapping (VAT
//  especially) can only be wrong in one place.
// ─────────────────────────────────────────────────────────────────────────────
import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

export const adminDb = () =>
  createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

// Where the owner's copy of each invoice goes. Falls back to the address already
// printed on the invoice itself (see the checkout function's invoice message).
const OWNER_EMAIL = Deno.env.get('OWNER_EMAIL') ?? 'discusmilenium@outlook.com'
const INVOICE_FROM = Deno.env.get('INVOICE_FROM_EMAIL') ?? 'invoices@discusmileniumcy.com'

/**
 * VAT is charged inclusively, so it is already inside `total` and cannot be
 * derived from it. The per-rate breakdown is the only place it is stated.
 */
export function invoiceVatCents(invoice: Stripe.Invoice): number {
  return (invoice.total_tax_amounts ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0)
}

/** Find the local order for an invoice: the caller's hint, else its payment intent. */
async function resolveOrderId(
  invoice: Stripe.Invoice,
  explicit: string | null,
): Promise<string | null> {
  if (explicit) return explicit
  const pi =
    typeof invoice.payment_intent === 'string'
      ? invoice.payment_intent
      : invoice.payment_intent?.id
  if (!pi) return null
  const { data } = await adminDb()
    .from('orders')
    .select('id')
    .eq('stripe_payment_intent_id', pi)
    .maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

/**
 * Upsert one Stripe invoice into public.invoices. Idempotent on
 * stripe_invoice_id, and never throws — a failed mirror must not cost us the
 * order. `notifyOwner` is off for backfills so importing history cannot fire a
 * burst of emails about sales that happened weeks ago.
 */
export async function mirrorInvoice(
  invoice: Stripe.Invoice,
  orderId: string | null,
  notifyOwner = true,
): Promise<void> {
  try {
    const vatCents = invoiceVatCents(invoice)
    const linkedOrderId = await resolveOrderId(invoice, orderId)

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
          // Left out when unknown so a later event cannot blank a link an
          // earlier one already established.
          ...(linkedOrderId ? { order_id: linkedOrderId } : {}),
        },
        { onConflict: 'stripe_invoice_id' },
      )
      .select('id, owner_emailed_at')
      .single()

    if (error) {
      console.error('[invoices] upsert failed:', invoice.id, error)
      return
    }

    if (notifyOwner) {
      await emailOwnerCopy(invoice, vatCents, data as { id: string; owner_emailed_at: string | null })
    }
  } catch (err) {
    console.error('[invoices] mirror failed:', invoice.id, err)
  }
}

/** Pull the invoice a completed Checkout session generated and mirror it. */
export async function mirrorSessionInvoice(session: Stripe.Checkout.Session): Promise<void> {
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
    console.error('[invoices] retrieve failed:', invoiceId, err)
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
        console.error('[invoices] PDF fetch failed:', pdf.status)
      }
    }

    const cur = (invoice.currency ?? 'eur').toUpperCase()
    const money = (c: number) => `${(c / 100).toFixed(2)} ${cur}`
    const total = invoice.total ?? 0
    const label = invoice.number ?? invoice.id
    const line = (k: string, v: string, strong = false) =>
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
            <p>A new sale has been invoiced. The attached PDF is the same one the customer received.</p>
            <table style="border-collapse:collapse;margin:16px 0">
              ${line('Invoice', label)}
              ${line('Customer', invoice.customer_name ?? '—')}
              ${line('Email', invoice.customer_email ?? '—')}
              ${line('Date', new Date((invoice.created ?? 0) * 1000).toISOString().slice(0, 16).replace('T', ' '))}
              ${line('Net', money(total - vatCents))}
              ${line('VAT (19% incl.)', money(vatCents))}
              ${line('Total', money(total), true)}
            </table>
            ${invoice.hosted_invoice_url ? `<p><a href="${invoice.hosted_invoice_url}">View this invoice in Stripe</a></p>` : ''}
          </div>`,
        ...(attachments.length ? { attachments } : {}),
      }),
    })
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
  } catch (err) {
    console.error('[invoices] owner email failed:', invoice.id, err)
    // Release the claim so a redelivered event can try again.
    await supabase.from('invoices').update({ owner_emailed_at: null }).eq('id', row.id)
  }
}
