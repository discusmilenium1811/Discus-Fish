// ─────────────────────────────────────────────────────────────────────────────
//  Admin-only invoice backfill.
//
//  The live path (stripe-webhook) mirrors each invoice as it is paid, so this is
//  for the two cases that path cannot cover: importing the invoices Stripe
//  issued before the mirror existed, and repairing a webhook delivery that was
//  missed. Driven by the "Sync from Stripe" button in Admin > Invoices.
//
//  Read-only against Stripe — it never re-issues, edits or voids an invoice, it
//  only copies what is already there. The owner copy is deliberately NOT emailed
//  for these, so importing history cannot fire a burst of emails about old sales.
// ─────────────────────────────────────────────────────────────────────────────
import { adminDb, mirrorInvoice, stripe } from '../_shared/invoices.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

// A hard ceiling so a stuck cursor can never walk the whole account forever.
const MAX_PAGES = 20
const PAGE_SIZE = 100

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    // Authenticate from the caller's JWT — never from anything in the body.
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    if (!token) return json({ error: 'Missing authorization' }, 401)

    const supabase = adminDb()
    const { data: userData, error: userErr } = await supabase.auth.getUser(token)
    const user = userData?.user
    if (userErr || !user) return json({ error: 'Invalid session' }, 401)

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if ((profile as { role: string } | null)?.role !== 'admin') {
      return json({ error: 'Admins only' }, 403)
    }

    let imported = 0
    let startingAfter: string | undefined
    for (let page = 0; page < MAX_PAGES; page++) {
      const batch = await stripe.invoices.list({
        limit: PAGE_SIZE,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      })
      for (const invoice of batch.data) {
        // Drafts have no number and no PDF yet — nothing to file.
        if (invoice.status === 'draft') continue
        await mirrorInvoice(invoice, null, false)
        imported++
      }
      if (!batch.has_more || batch.data.length === 0) break
      startingAfter = batch.data[batch.data.length - 1].id
    }

    return json({ imported })
  } catch (err) {
    console.error('[sync-invoices]', err)
    return json({ error: err instanceof Error ? err.message : 'Sync failed' }, 500)
  }
})
