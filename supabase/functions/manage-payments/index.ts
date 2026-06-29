import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
const service = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authorization = req.headers.get('authorization') ?? ''
  const token = authorization.replace(/^Bearer\s+/i, '')
  const { data: authData, error: authError } = await service.auth.getUser(token)
  if (authError || !authData.user) return json({ error: 'Authentication required' }, 401)

  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle()
  if (profile?.role !== 'admin') return json({ error: 'Administrator access required' }, 403)

  try {
    const body = await req.json()
    if (body.action === 'sync') return await syncAllPayments()
    return json({ error: 'Unknown action' }, 400)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment operation failed'
    console.error('[manage-payments]', err)
    return json({ error: message }, 400)
  }
})

async function syncAllPayments() {
  const { data: orders, error } = await service
    .from('orders')
    .select('id, stripe_payment_intent_id')
    .not('stripe_payment_intent_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1000)
  if (error) throw error

  let synced = 0
  const failed: string[] = []
  for (const order of orders ?? []) {
    try {
      await syncPayment(order.id, order.stripe_payment_intent_id)
      synced += 1
    } catch (err) {
      console.error('[manage-payments] sync failed:', order.id, err)
      failed.push(order.id)
    }
  }
  return json({ synced, failed: failed.length })
}

async function syncPayment(orderId: string, paymentIntentId: string) {
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

  const { error } = await service.from('payments').upsert(
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
