import { useEffect, useState } from 'react'
import { fetchAll, insertRow, deleteRow, fmtDate, eurosToCents, centsToEuros } from '../lib/adminApi'
import { formatPrice } from '../../lib/format'
import {
  PageHeader,
  ErrorNote,
  Card,
  Modal,
  Field,
  TableState,
  fieldCls,
  btnPrimary,
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
  invoice_number: string
  total_cents: number
  currency: string
  pdf_url: string | null
  issued_at: string
  order_id: string
  orders: { order_number: string | null } | null
}
interface OrderOpt {
  id: string
  order_number: string | null
  amount_total_cents: number
}

export function Invoices() {
  const [rows, setRows] = useState<Invoice[]>([])
  const [orders, setOrders] = useState<OrderOpt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [q, setQ] = useQuery()

  async function refresh() {
    setLoading(true)
    try {
      const [inv, o] = await Promise.all([
        fetchAll<Invoice>('invoices', '*, orders(order_number)', { col: 'issued_at', asc: false }),
        fetchAll<OrderOpt>('orders', 'id, order_number, amount_total_cents', {
          col: 'created_at',
          asc: false,
        }),
      ])
      setRows(inv)
      setOrders(o)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    refresh()
  }, [])

  async function remove(i: Invoice) {
    if (!confirm(`Delete invoice ${i.invoice_number}?`)) return
    try {
      await deleteRow('invoices', i.id)
      setRows((r) => r.filter((x) => x.id !== i.id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const shown = rows.filter((i) =>
    matchQuery(q, [i.invoice_number, i.orders?.order_number]),
  )

  return (
    <div>
      <PageHeader
        icon="📄"
        title="Invoices"
        description="Auto-numbered invoices (INV-1001…). Generate one for an order and attach a PDF link."
        action={
          <div className="flex items-center gap-2">
            <PageSearch q={q} setQ={setQ} placeholder="Search invoices…" />
            <button className={btnPrimary} onClick={() => setAdding(true)} disabled={orders.length === 0}>
              + New invoice
            </button>
          </div>
        }
      />
      <ErrorNote msg={error} />
      <Card>
        <table className={tableCls}>
          <thead className={theadCls}>
            <tr>
              <th className={thCls}>Invoice</th>
              <th className={thCls}>Order</th>
              <th className={thCls}>Total</th>
              <th className={thCls}>Issued</th>
              <th className={`${thCls} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tbodyCls}>
            {loading ? (
              <TableState colSpan={5} text="Loading…" />
            ) : shown.length === 0 ? (
              <TableState colSpan={5} text={q ? 'No matching invoices.' : 'No invoices yet.'} />
            ) : (
              shown.map((i) => (
                <tr key={i.id} className={trCls}>
                  <td className="px-4 py-3 font-semibold text-white">{i.invoice_number}</td>
                  <td className="px-4 py-3 text-slate-300">{i.orders?.order_number ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-200">{formatPrice(i.total_cents, i.currency)}</td>
                  <td className="px-4 py-3 text-slate-400">{fmtDate(i.issued_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {i.pdf_url && (
                      <a href={i.pdf_url} target="_blank" rel="noreferrer" className={`${btnSmall} text-cyan-300`}>
                        PDF
                      </a>
                    )}
                    <button className={`${btnSmall} ml-2 text-rose-300`} onClick={() => remove(i)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {adding && (
        <InvoiceForm
          orders={orders}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false)
            refresh()
          }}
        />
      )}
    </div>
  )
}

function InvoiceForm({
  orders,
  onClose,
  onSaved,
}: {
  orders: OrderOpt[]
  onClose: () => void
  onSaved: () => void
}) {
  const [orderId, setOrderId] = useState(orders[0]?.id ?? '')
  const [total, setTotal] = useState(centsToEuros(orders[0]?.amount_total_cents))
  const [pdfUrl, setPdfUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function pickOrder(id: string) {
    setOrderId(id)
    const o = orders.find((x) => x.id === id)
    if (o) setTotal(centsToEuros(o.amount_total_cents))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!orderId) return setError('Choose an order.')
    setSaving(true)
    try {
      await insertRow('invoices', {
        order_id: orderId,
        total_cents: eurosToCents(total || 0),
        currency: 'eur',
        pdf_url: pdfUrl.trim() || null,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="New invoice"
      onClose={onClose}
      footer={
        <>
          <button className={btnGhost} onClick={onClose} type="button">
            Cancel
          </button>
          <button className={btnPrimary} form="inv-form" disabled={saving}>
            {saving ? 'Saving…' : 'Create'}
          </button>
        </>
      }
    >
      <form id="inv-form" onSubmit={submit} className="grid gap-4">
        <ErrorNote msg={error} />
        <Field label="Order">
          <select className={fieldCls} value={orderId} onChange={(e) => pickOrder(e.target.value)}>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.order_number ?? o.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Total (€)">
          <input className={fieldCls} type="number" step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} />
        </Field>
        <Field label="PDF URL (optional)">
          <input className={fieldCls} value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://…" />
        </Field>
      </form>
    </Modal>
  )
}
