// End-to-end check of the fulfillment flow: paid order -> label_created -> on_the_way
// -> out_for_delivery -> delivered, plus who can see and change what along the way.
//
// This drives the REAL path: it signs in as the admin account rather than using the
// service-role key, so every write goes through RLS exactly as the admin panel does.
// Run it after touching anything in src/admin/pages/Tracking.tsx, src/lib/tracking.ts,
// src/pages/TrackingDelivery.tsx or the shipments / tracking_events tables.
//
// It WRITES TO WHATEVER PROJECT THE ENV POINTS AT — there is no test database. It
// creates two throwaway @discusfood.test users and one order, then deletes all of it
// in a finally block. Nothing pre-existing is touched.
//
// Usage:
//   TEST_ADMIN_EMAIL=… TEST_ADMIN_PASSWORD=… node scripts/test-fulfillment.mjs
//
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from .env and
// SUPABASE_SERVICE_ROLE_KEY from server/.env unless they are already in the
// environment. Exits 1 if any check fails.
import { readFileSync } from 'node:fs'

function readEnvFile(path) {
  try {
    return Object.fromEntries(
      readFileSync(path, 'utf8')
        .split(/\r?\n/)
        .filter((line) => line.includes('=') && !line.trimStart().startsWith('#'))
        .map((line) => [line.slice(0, line.indexOf('=')).trim(), line.slice(line.indexOf('=') + 1).trim()]),
    )
  } catch {
    return {}
  }
}

const root = readEnvFile('.env')
const server = readEnvFile('server/.env')

const URL = process.env.VITE_SUPABASE_URL || root.VITE_SUPABASE_URL || server.SUPABASE_URL
const ANON = process.env.VITE_SUPABASE_ANON_KEY || root.VITE_SUPABASE_ANON_KEY
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY || server.SUPABASE_SERVICE_ROLE_KEY
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD

const missing = Object.entries({ URL, ANON, SVC, TEST_ADMIN_EMAIL: ADMIN_EMAIL, TEST_ADMIN_PASSWORD: ADMIN_PASSWORD })
  .filter(([, value]) => !value)
  .map(([name]) => name)
if (missing.length) {
  console.error(`Missing config: ${missing.join(', ')}\nSee the usage note at the top of this file.`)
  process.exit(1)
}

console.log(`Target project: ${URL}`)
console.log(`Admin account:  ${ADMIN_EMAIL}\n`)

const pass = []
const fail = []
function check(label, ok, detail = '') {
  ;(ok ? pass : fail).push(label)
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${label}${detail ? `  -> ${detail}` : ''}`)
}

async function rest(path, { token = ANON, method = 'GET', body, prefer } = {}) {
  const headers = { apikey: ANON, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  if (prefer) headers.Prefer = prefer
  const res = await fetch(`${URL}/rest/v1/${path}`, { method, headers, body: body && JSON.stringify(body) })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { /* not json */ }
  return { status: res.status, ok: res.ok, json, text }
}

async function auth(path, body) {
  const res = await fetch(`${URL}/auth/v1/${path}`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

const signUp = async (email, password) => {
  const j = await auth('signup', { email, password })
  return { id: j.id ?? j.user?.id, token: j.access_token }
}
const signIn = async (email, password) => {
  const j = await auth('token?grant_type=password', { email, password })
  return { token: j.access_token, error: j.error_description || j.msg }
}

const created = { users: [], orderId: null, shipmentId: null }

try {
  const stamp = Date.now()

  console.log('=== 1. Two throwaway customers ===')
  const custA = await signUp(`fulfil-a-${stamp}@discusfood.test`, `Test!Fulfil-${stamp}aZ`)
  const custB = await signUp(`fulfil-b-${stamp}@discusfood.test`, `Test!Fulfil-${stamp}bZ`)
  created.users.push(custA.id, custB.id)
  check('customer A signed up', Boolean(custA.id && custA.token))
  check('customer B signed up', Boolean(custB.id && custB.token))
  if (!custA.token || !custB.token) throw new Error('signup failed')

  console.log('\n=== 2. A paid order owned by customer A ===')
  const stockBefore = await rest('stock_movements?select=id', { token: SVC })
  const order = await rest('orders', {
    token: SVC, method: 'POST', prefer: 'return=representation',
    body: {
      stripe_session_id: `fulfillment-test-${stamp}`,
      email: `fulfil-a-${stamp}@discusfood.test`,
      amount_total_cents: 2450, currency: 'eur', status: 'paid',
      user_id: custA.id, subtotal_cents: 1950, shipping_cents: 500,
      ship_name: 'Test Customer A', ship_city: 'Nicosia', ship_country: 'CY',
      ship_address1: '1 Test Street', ship_postal_code: '1010',
      admin_note: `fulfillment-test-${stamp}`,
    },
  })
  created.orderId = order.json?.[0]?.id
  check('order created', Boolean(created.orderId), `#${order.json?.[0]?.order_number}`)
  check('order starts unfulfilled', order.json?.[0]?.fulfillment_status === 'unfulfilled', order.json?.[0]?.fulfillment_status)
  if (!created.orderId) throw new Error('could not seed an order')

  console.log('\n=== 3. Sign in as the admin (writes go through RLS) ===')
  const admin = await signIn(ADMIN_EMAIL, ADMIN_PASSWORD)
  check('admin signed in', Boolean(admin.token), admin.error ?? '')
  if (!admin.token) throw new Error('cannot continue without an admin session')

  console.log('\n=== 4. Walk every UPS stage (mirrors Tracking.tsx ShipmentForm) ===')
  const stages = [
    { status: 'label_created',    fulfillment: 'processing', location: 'Larnaca, CY', detail: 'Label created, awaiting pickup' },
    { status: 'on_the_way',       fulfillment: 'shipped',    location: 'Athens, GR',  detail: 'In transit through the hub' },
    { status: 'out_for_delivery', fulfillment: 'shipped',    location: 'Nicosia, CY', detail: 'On the van for delivery today' },
    { status: 'delivered',        fulfillment: 'delivered',  location: 'Nicosia, CY', detail: 'Handed to the recipient' },
  ]

  for (const [i, stage] of stages.entries()) {
    const now = new Date().toISOString()
    const payload = {
      order_id: created.orderId, carrier: 'UPS',
      tracking_number: `1Z-TEST-${stamp}`,
      tracking_url: `https://www.ups.com/track?tracknum=1Z-TEST-${stamp}`,
      status: stage.status, status_detail: stage.detail, last_location: stage.location,
      estimated_delivery_at: new Date(Date.now() + 3 * 864e5).toISOString(),
      shipped_at: stage.status !== 'label_created' ? now : null,
      delivered_at: stage.status === 'delivered' ? now : null,
      updated_at: now,
    }
    let shipment
    if (i === 0) {
      shipment = await rest('shipments', { token: admin.token, method: 'POST', prefer: 'return=representation', body: payload })
      created.shipmentId = shipment.json?.[0]?.id
    } else {
      shipment = await rest(`shipments?id=eq.${created.shipmentId}`, { token: admin.token, method: 'PATCH', prefer: 'return=representation', body: payload })
    }
    const event = await rest('tracking_events', {
      token: admin.token, method: 'POST', prefer: 'return=representation',
      body: { shipment_id: created.shipmentId, status: stage.status, description: stage.detail, location: stage.location, event_at: now },
    })
    const updated = await rest(`orders?id=eq.${created.orderId}`, {
      token: admin.token, method: 'PATCH', prefer: 'return=representation',
      body: { fulfillment_status: stage.fulfillment },
    })

    check(`${stage.status} — shipment written`, shipment.ok && Boolean(created.shipmentId), `HTTP ${shipment.status}`)
    check(`${stage.status} — tracking event written`, event.ok, `HTTP ${event.status}${event.ok ? '' : ' ' + event.text.slice(0, 110)}`)
    check(`${stage.status} — order.fulfillment_status = ${stage.fulfillment}`,
      updated.json?.[0]?.fulfillment_status === stage.fulfillment, updated.json?.[0]?.fulfillment_status)
  }

  console.log('\n=== 5. What the owning customer sees (mirrors fetchMyDeliveries) ===')
  const aOrders = await rest(`orders?user_id=eq.${custA.id}&select=id,order_number,fulfillment_status`, { token: custA.token })
  check('customer A sees their order', aOrders.json?.length === 1, `${aOrders.json?.length} row(s)`)
  check('…marked delivered', aOrders.json?.[0]?.fulfillment_status === 'delivered', aOrders.json?.[0]?.fulfillment_status)

  const aShip = await rest(`shipments?order_id=eq.${created.orderId}&select=id,status,tracking_number,delivered_at`, { token: custA.token })
  check('customer A sees the shipment', aShip.json?.length === 1, `${aShip.json?.length} row(s)`)
  check('…status delivered, delivered_at set', aShip.json?.[0]?.status === 'delivered' && Boolean(aShip.json?.[0]?.delivered_at))

  const aEvents = await rest(`tracking_events?shipment_id=eq.${created.shipmentId}&select=status,event_at&order=event_at.desc`, { token: custA.token })
  check('customer A sees all 4 tracking events', aEvents.json?.length === 4, `${aEvents.json?.length} event(s)`)
  if (aEvents.json?.length) console.log('    timeline:', aEvents.json.map((e) => e.status).reverse().join(' -> '))

  console.log('\n=== 6. Constraints from 20260829000000_fulfilment_hardening ===')
  const gone = await rest('tracking_events?select=occurred_at&limit=1', { token: SVC })
  check('dead occurred_at column is gone', gone.status === 400 && /occurred_at/.test(gone.text), `HTTP ${gone.status}`)

  const badStatus = await rest(`shipments?id=eq.${created.shipmentId}`, { token: admin.token, method: 'PATCH', body: { status: 'totally_made_up' } })
  check('invalid delivery status rejected', !badStatus.ok, `HTTP ${badStatus.status} ${badStatus.json?.message ?? ''}`.slice(0, 110))

  const dupe = await rest('shipments', {
    token: admin.token, method: 'POST', prefer: 'return=representation',
    body: { order_id: created.orderId, carrier: 'UPS', status: 'label_created' },
  })
  check('second shipment on the same order rejected', !dupe.ok, `HTTP ${dupe.status} ${dupe.json?.message ?? ''}`.slice(0, 110))

  const stillOne = await rest(`shipments?order_id=eq.${created.orderId}&select=id,status`, { token: SVC })
  check('order still has exactly one, unchanged shipment',
    stillOne.json?.length === 1 && stillOne.json[0].status === 'delivered',
    `${stillOne.json?.length} row(s), status=${stillOne.json?.[0]?.status}`)

  console.log('\n=== 7. Isolation ===')
  const bOrders = await rest('orders?select=id', { token: custB.token })
  check('customer B sees no orders', bOrders.json?.length === 0, `${bOrders.json?.length} row(s)`)
  const bShip = await rest(`shipments?id=eq.${created.shipmentId}&select=id`, { token: custB.token })
  check('customer B cannot see the shipment', bShip.json?.length === 0, `${bShip.json?.length} row(s)`)
  const bEvents = await rest(`tracking_events?shipment_id=eq.${created.shipmentId}&select=id`, { token: custB.token })
  check('customer B cannot see the tracking events', bEvents.json?.length === 0, `${bEvents.json?.length} row(s)`)
  const anonShip = await rest('shipments?select=id', {})
  check('anonymous sees no shipments', anonShip.json?.length === 0, `${anonShip.json?.length} row(s)`)

  // An RLS-blocked PATCH returns 204 ("matched 0 rows"), not 403 — assert on the data.
  await rest(`shipments?id=eq.${created.shipmentId}`, { token: custB.token, method: 'PATCH', body: { last_location: 'TAMPERED' } })
  const untouched = await rest(`shipments?id=eq.${created.shipmentId}&select=last_location`, { token: SVC })
  check('customer B cannot tamper with the shipment', untouched.json?.[0]?.last_location !== 'TAMPERED',
    `location is "${untouched.json?.[0]?.last_location}"`)

  console.log('\n=== 8. Inventory is untouched (stock moves at checkout, not here) ===')
  const stockAfter = await rest('stock_movements?select=id', { token: SVC })
  check('no stock movements recorded during fulfillment',
    stockAfter.json?.length === stockBefore.json?.length,
    `${stockBefore.json?.length} -> ${stockAfter.json?.length}`)
} catch (err) {
  console.error(`\nABORTED: ${err.message}`)
  fail.push(`aborted: ${err.message}`)
} finally {
  console.log('\n=== Cleanup ===')
  if (created.shipmentId) {
    await rest(`tracking_events?shipment_id=eq.${created.shipmentId}`, { token: SVC, method: 'DELETE' })
    await rest(`shipments?id=eq.${created.shipmentId}`, { token: SVC, method: 'DELETE' })
  }
  if (created.orderId) {
    await rest(`order_items?order_id=eq.${created.orderId}`, { token: SVC, method: 'DELETE' })
    await rest(`orders?id=eq.${created.orderId}`, { token: SVC, method: 'DELETE' })
  }
  for (const id of created.users.filter(Boolean)) {
    await fetch(`${URL}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: { apikey: SVC, Authorization: `Bearer ${SVC}` } })
  }
  const leftovers = await rest('orders?select=id&admin_note=like.fulfillment-test-*', { token: SVC })
  console.log(`  removed ${created.users.filter(Boolean).length} user(s), the order, shipment and events`)
  console.log(`  leftover test orders: ${leftovers.json?.length ?? '?'}`)

  console.log(`\n=== ${pass.length} passed, ${fail.length} failed ===`)
  if (fail.length) {
    console.log('FAILURES:')
    fail.forEach((f) => console.log('  - ' + f))
  }
  process.exit(fail.length ? 1 : 0)
}
