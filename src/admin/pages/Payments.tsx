import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAll, fmtDate } from '../lib/adminApi'
import { formatPrice } from '../../lib/format'
import { supabase } from '../../lib/supabase'
import {
  PageHeader,
  ErrorNote,
  Card,
  Pill,
  TableState,
  btnPrimary,
  btnSmall,
  tableCls,
  theadCls,
  thCls,
  tbodyCls,
  trCls,
} from '../components/ui'
import { PageSearch } from '../components/PageSearch'
import { useQuery, matchQuery } from '../lib/pageQuery'

type PayStatus = 'pending' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded'

interface Payment {
  id: string
  created_at: string
  amount_cents: number
  amount_refunded_cents: number
  currency: string
  status: PayStatus
  method: string | null
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  order_id: string | null
  orders: { order_number: string | null; email: string | null; ship_name: string | null } | null
}

const tone = (status: PayStatus) =>
  status === 'succeeded'
    ? 'green'
    : status === 'failed'
      ? 'rose'
      : status.includes('refund')
        ? 'amber'
        : 'slate'

const label = (status: PayStatus) => ({
  pending: 'Pending',
  succeeded: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  partially_refunded: 'Partially refunded',
})[status]

export function Payments() {
  const [rows, setRows] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [q, setQ] = useQuery()

  const refresh = useCallback(async () => {
    try {
      setRows(
        await fetchAll<Payment>(
          'payments',
          '*, orders(order_number, email, ship_name)',
          { col: 'created_at', asc: false },
        ),
      )
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment records')
    } finally {
      setLoading(false)
    }
  }, [])

  const syncPayments = useCallback(async (showNotice = true) => {
    setSyncing(true)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('manage-payments', {
        body: { action: 'sync' },
      })
      if (invokeError) throw invokeError
      if (data?.error) throw new Error(data.error)
      if (showNotice) {
        setNotice(`Stripe synchronized: ${data?.synced ?? 0} payment(s)${data?.failed ? ` · ${data.failed} failed` : ''}.`)
      }
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stripe synchronization failed')
      await refresh()
    } finally {
      setSyncing(false)
    }
  }, [refresh])

  useEffect(() => {
    const timer = window.setTimeout(() => void syncPayments(false), 0)
    return () => window.clearTimeout(timer)
  }, [syncPayments])

  const shown = rows.filter((payment) =>
    matchQuery(q, [
      payment.orders?.order_number,
      payment.orders?.email,
      payment.orders?.ship_name,
      payment.stripe_payment_intent_id,
      payment.stripe_charge_id,
      payment.method,
      payment.status,
    ]),
  )

  const totals = useMemo(() => {
    const captured = rows
      .filter((payment) => payment.status !== 'failed' && payment.status !== 'pending')
      .reduce((sum, payment) => sum + payment.amount_cents, 0)
    const refunded = rows.reduce((sum, payment) => sum + payment.amount_refunded_cents, 0)
    return { captured, refunded, net: Math.max(0, captured - refunded) }
  }, [rows])

  return (
    <div>
      <PageHeader
        icon="💳"
        title="Order Payments"
        description="Read-only Stripe payment ledger. Statuses, payment methods and refund totals are synchronized automatically from Stripe."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <PageSearch q={q} setQ={setQ} placeholder="Search order, customer or intent…" />
            <button className={btnPrimary} type="button" onClick={() => void syncPayments()} disabled={syncing}>
              {syncing ? 'Syncing…' : '↻ Sync Stripe'}
            </button>
          </div>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Summary label="Captured" value={formatPrice(totals.captured, 'eur')} tone="cyan" />
        <Summary label="Refunded" value={formatPrice(totals.refunded, 'eur')} tone="amber" />
        <Summary label="Net payments" value={formatPrice(totals.net, 'eur')} tone="green" />
      </div>

      <div className="mb-5 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm leading-6 text-slate-300">
        <strong className="text-cyan-200">Stripe is the source of truth.</strong> Payment statuses cannot be edited manually. For maximum security, create and manage refunds only from the protected Stripe Dashboard.
      </div>
      {notice && <div className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{notice}</div>}
      <ErrorNote msg={error} />

      <Card>
        <table className={tableCls}>
          <thead className={theadCls}>
            <tr>
              <th className={thCls}>Date</th>
              <th className={thCls}>Order & customer</th>
              <th className={thCls}>Method</th>
              <th className={thCls}>Amount</th>
              <th className={thCls}>Refunded</th>
              <th className={thCls}>Status</th>
              <th className={`${thCls} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tbodyCls}>
            {loading ? (
              <TableState colSpan={7} text="Synchronizing Stripe payments…" />
            ) : shown.length === 0 ? (
              <TableState colSpan={7} text={q ? 'No matching payments.' : 'No completed Stripe payments yet.'} />
            ) : (
              shown.map((payment) => {
                return (
                  <tr key={payment.id} className={trCls}>
                    <td className="px-4 py-3 text-slate-300">{fmtDate(payment.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">#{payment.orders?.order_number ?? '—'}</div>
                      <div className="mt-1 text-xs text-slate-500">{payment.orders?.ship_name || payment.orders?.email || 'Customer'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{payment.method ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{formatPrice(payment.amount_cents, payment.currency)}</td>
                    <td className="px-4 py-3 text-slate-400">{payment.amount_refunded_cents ? formatPrice(payment.amount_refunded_cents, payment.currency) : '—'}</td>
                    <td className="px-4 py-3"><Pill tone={tone(payment.status) as 'green' | 'rose' | 'amber' | 'slate'}>{label(payment.status)}</Pill></td>
                    <td className="px-4 py-3 text-right">
                      {payment.stripe_payment_intent_id && (
                        <a href={`https://dashboard.stripe.com/search?query=${encodeURIComponent(payment.stripe_payment_intent_id)}`} target="_blank" rel="noreferrer" className={btnSmall}>Stripe ↗</a>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </Card>

    </div>
  )
}

function Summary({ label: title, value, tone: color }: { label: string; value: string; tone: 'cyan' | 'amber' | 'green' }) {
  const colors = { cyan: 'border-cyan-400/20 bg-cyan-400/5 text-cyan-200', amber: 'border-amber-400/20 bg-amber-400/5 text-amber-200', green: 'border-emerald-400/20 bg-emerald-400/5 text-emerald-200' }
  return <div className={`rounded-xl border p-4 ${colors[color]}`}><div className="text-xl font-black">{value}</div><div className="mt-1 text-xs font-semibold uppercase tracking-wide opacity-75">{title}</div></div>
}
