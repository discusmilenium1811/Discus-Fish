import { createClient } from 'npm:@supabase/supabase-js@2'

// ─────────────────────────────────────────────────────────────────────────
//  Business-account verification via the EU VIES VAT service.
//
//  Called by the browser right after a business account signs up. It reads the
//  caller's JWT (never a client-supplied user id), validates the account's VAT
//  number against VIES, and:
//    * VAT valid   → business_status = 'approved'  (wholesale prices unlock).
//    * VAT invalid /
//      VIES error  → business_status stays 'pending' (admin reviews manually,
//                    resolved within ~24h). The customer keeps seeing retail
//                    prices meanwhile.
//  It only ever touches the caller's own profile.
// ─────────────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Admin client (service role) for the profile update; bypasses RLS.
const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

/** Split "CY12345678X" → { country: 'CY', number: '12345678X' }. */
function parseVat(raw: string): { country: string; number: string } | null {
  const cleaned = (raw ?? '').toUpperCase().replace(/[\s.-]/g, '')
  const m = cleaned.match(/^([A-Z]{2})([0-9A-Z]{2,})$/)
  if (!m) return null
  // VIES uses "EL" for Greece even though the ISO code is "GR".
  const country = m[1] === 'GR' ? 'EL' : m[1]
  return { country, number: m[2] }
}

/** Query VIES; returns true only on an explicit valid response. */
async function viesIsValid(country: string, number: string): Promise<boolean> {
  const url = `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${country}/vat/${number}`
  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: ctrl.signal,
    })
    if (!res.ok) return false
    const data = await res.json()
    // The REST API returns `isValid`; older/proxy shapes use `valid`.
    return data?.isValid === true || data?.valid === true
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    // Authenticate the caller from their JWT — never trust a body user id.
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) return json({ error: 'Missing authorization' }, 401)

    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    const user = userData?.user
    if (userErr || !user) return json({ error: 'Invalid session' }, 401)

    // Load the caller's profile; only business accounts are verified.
    const { data: profile } = await admin
      .from('profiles')
      .select('account_type, vat_number, business_status')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || profile.account_type !== 'business') {
      return json({ status: profile?.business_status ?? 'pending' })
    }
    // Already approved (e.g. re-run) — nothing to do.
    if (profile.business_status === 'approved') {
      return json({ status: 'approved' })
    }

    const parsed = parseVat(profile.vat_number ?? '')
    const valid = parsed ? await viesIsValid(parsed.country, parsed.number) : false
    const status = valid ? 'approved' : 'pending'

    // Only bump to 'approved'; never downgrade an admin decision here.
    if (status === 'approved') {
      const { error: updErr } = await admin
        .from('profiles')
        .update({ business_status: 'approved' })
        .eq('id', user.id)
      if (updErr) throw updErr
    }

    return json({ status })
  } catch (err) {
    console.error('[verify-business]', err)
    return json({ error: err instanceof Error ? err.message : 'Verification failed' }, 500)
  }
})
