import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAll, fmtDateTime } from '../lib/adminApi'
import { supabase } from '../../lib/supabase'
import { formatPrice } from '../../lib/format'
import {
  PageHeader,
  ErrorNote,
  Card,
  Pill,
  TableState,
  btnGhost,
  btnSmall,
  tableCls,
  theadCls,
  thCls,
  tbodyCls,
  trCls,
} from '../components/ui'
import { PageSearch } from '../components/PageSearch'
import { useQuery, matchQuery } from '../lib/pageQuery'

interface Invoice {
  id: string
  stripe_invoice_id: string
  number: string | null
  status: string | null
  customer_name: string | null
  customer_email: string | null
  currency: string
  subtotal_cents: number
  vat_cents: number
  total_cents: number
  hosted_invoice_url: string | null
  invoice_pdf_url: string | null
  issued_at: string | null
}

const tone = (s: string | null) =>
  s === 'paid' ? 'green' : s === 'void' || s === 'uncollectible' ? 'rose' : 'amber'

const SYNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-invoices`

export function Invoices() {
  const [rows, setRows] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [q, setQ] = useQuery()

  const refresh = useCallback(async () => {
    try {
      setRows(await fetchAll<Invoice>('invoices', '*', { col: 'issued_at', asc: false }))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  // Deferred a tick so the first load does not set state during the effect
  // itself — same pattern as Orders.tsx.
  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0)
    return () => window.clearTimeout(timer)
  }, [refresh])

  /** Import anything Stripe has that is not here yet — history, or a missed webhook. */
  async function syncFromStripe() {
    setSyncing(true)
    setNotice('')
    setError('')
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Session expired — sign in again.')
      const res = await fetch(SYNC_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? `Sync failed (${res.status})`)
      setNotice(`Checked ${body.imported} invoice${body.imported === 1 ? '' : 's'} in Stripe.`)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const shown = useMemo(
    () =>
      rows.filter((i) =>
        matchQuery(q, [i.number, i.customer_name, i.customer_email, i.status]),
      ),
    [rows, q],
  )

  // Totals for whatever is currently on screen, so filtering by month or by
  // customer gives the figure straight away instead of needing a spreadsheet.
  const sums = useMemo(
    () =>
      shown.reduce(
        (acc, i) => ({
          net: acc.net + (i.total_cents - i.vat_cents),
          vat: acc.vat + i.vat_cents,
          total: acc.total + i.total_cents,
        }),
        { net: 0, vat: 0, total: 0 },
      ),
    [shown],
  )
  const currency = shown[0]?.currency ?? 'eur'

  return (
    <div>
      <PageHeader
        icon="📄"
        title="Invoices"
        description="Every invoice Stripe issued for a paid order. The PDF is Stripe's own file — the exact document the customer received — so it can be filed as-is."
        action={
          <div className="flex items-center gap-2">
            <button className={btnGhost} onClick={syncFromStripe} disabled={syncing}>
              {syncing ? 'Syncing…' : 'Sync from Stripe'}
            </button>
            <button
              className={btnGhost}
              onClick={() => downloadCsv(shown)}
              disabled={shown.length === 0}
            >
              Export CSV
            </button>
            <PageSearch q={q} setQ={setQ} placeholder="Search invoices…" />
          </div>
        }
      />
      <ErrorNote msg={error} />
      {notice && (
        <p className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {notice}
        </p>
      )}
      <Card>
        <table className={tableCls}>
          <thead className={theadCls}>
            <tr>
              <th className={thCls}>Invoice</th>
              <th className={thCls}>Customer</th>
              <th className={thCls}>Date &amp; time</th>
              <th className={`${thCls} text-right`}>Net</th>
              <th className={`${thCls} text-right`}>VAT</th>
              <th className={`${thCls} text-right`}>Total</th>
              <th className={thCls}>Status</th>
              <th className={`${thCls} text-right`}>Document</th>
            </tr>
          </thead>
          <tbody className={tbodyCls}>
            {loading ? (
              <TableState colSpan={8} text="Loading…" />
            ) : shown.length === 0 ? (
              <TableState
                colSpan={8}
                text={
                  q
                    ? 'No matching invoices.'
                    : 'No invoices yet. One is recorded here after every paid order.'
                }
              />
            ) : (
              shown.map((i) => (
                <tr key={i.id} className={trCls}>
                  <td className="px-4 py-3 font-semibold text-white">
                    {i.number ?? i.stripe_invoice_id.slice(0, 14)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-200">{i.customer_name ?? '—'}</div>
                    <div className="text-xs text-slate-500">{i.customer_email ?? '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{fmtDateTime(i.issued_at)}</td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatPrice(i.total_cents - i.vat_cents, i.currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatPrice(i.vat_cents, i.currency)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-white">
                    {formatPrice(i.total_cents, i.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <Pill tone={tone(i.status) as 'green' | 'rose' | 'amber'}>
                      {i.status ?? 'unknown'}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {i.invoice_pdf_url && (
                        <a
                          className={btnSmall}
                          href={i.invoice_pdf_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          PDF
                        </a>
                      )}
                      {i.hosted_invoice_url && (
                        <a
                          className={btnSmall}
                          href={i.hosted_invoice_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      )}
                      {!i.invoice_pdf_url && !i.hosted_invoice_url && (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {shown.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-end gap-x-8 gap-y-1 text-sm">
          <span className="text-slate-400">
            {shown.length} invoice{shown.length === 1 ? '' : 's'}
          </span>
          <span className="text-slate-400">
            Net <span className="text-slate-200">{formatPrice(sums.net, currency)}</span>
          </span>
          <span className="text-slate-400">
            VAT <span className="text-slate-200">{formatPrice(sums.vat, currency)}</span>
          </span>
          <span className="text-slate-400">
            Total <span className="font-semibold text-white">{formatPrice(sums.total, currency)}</span>
          </span>
        </div>
      )}
    </div>
  )
}

/** Export what is on screen as CSV, for handing to an accountant. */
function downloadCsv(rows: Invoice[]) {
  const cell = (v: string | number | null) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const money = (c: number) => (c / 100).toFixed(2)
  const csv = [
    ['Invoice', 'Date', 'Customer', 'Email', 'Currency', 'Net', 'VAT', 'Total', 'Status'].join(','),
    ...rows.map((i) =>
      [
        cell(i.number ?? i.stripe_invoice_id),
        cell(i.issued_at ?? ''),
        cell(i.customer_name),
        cell(i.customer_email),
        cell(i.currency.toUpperCase()),
        cell(money(i.total_cents - i.vat_cents)),
        cell(money(i.vat_cents)),
        cell(money(i.total_cents)),
        cell(i.status),
      ].join(','),
    ),
  ].join('\r\n')

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
