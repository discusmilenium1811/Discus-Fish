import { useCallback, useEffect, useState } from 'react'
import {
  fetchAll,
  insertRow,
  insertRowReturning,
  updateRow,
  deleteRow,
  fmtDate,
  toTs,
} from '../lib/adminApi'
import {
  PageHeader,
  ErrorNote,
  Card,
  Pill,
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
import { upsTrackingUrl, type DeliveryStatus, type TrackingEvent } from '../../lib/tracking'

const STATUSES: { value: DeliveryStatus; label: string }[] = [
  { value: 'label_created', label: 'Label Created' },
  { value: 'on_the_way', label: 'Shipped / On the Way' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'access_point', label: 'At UPS Access Point' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'exception', label: 'Exception / Delay' },
]

interface Shipment {
  id: string
  order_id: string
  carrier: string | null
  tracking_number: string | null
  tracking_url: string | null
  status: DeliveryStatus
  status_detail: string | null
  last_location: string | null
  estimated_delivery_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  updated_at: string
  orders: {
    order_number: string | null
    ship_name: string | null
    email: string | null
  } | null
}

interface OrderOpt {
  id: string
  order_number: string | null
  ship_name: string | null
  email: string | null
}

export function Tracking() {
  const [rows, setRows] = useState<Shipment[]>([])
  const [orders, setOrders] = useState<OrderOpt[]>([])
  const [events, setEvents] = useState<TrackingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Shipment | 'new' | null>(null)
  const [q, setQ] = useQuery()

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [shipments, allOrders, trackingEvents] = await Promise.all([
        fetchAll<Shipment>(
          'shipments',
          '*, orders(order_number, ship_name, email)',
          { col: 'updated_at', asc: false },
        ),
        fetchAll<OrderOpt>('orders', 'id, order_number, ship_name, email', { col: 'created_at', asc: false }),
        fetchAll<TrackingEvent>('tracking_events', '*', { col: 'event_at', asc: false }),
      ])
      setRows(shipments)
      setOrders(allOrders)
      setEvents(trackingEvents)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0)
    return () => window.clearTimeout(timer)
  }, [refresh])

  async function remove(shipment: Shipment) {
    if (!confirm('Delete this shipment and its tracking history?')) return
    try {
      await deleteRow('shipments', shipment.id)
      setRows((current) => current.filter((item) => item.id !== shipment.id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const shown = rows.filter((shipment) =>
    matchQuery(q, [
      shipment.orders?.order_number,
      shipment.orders?.ship_name,
      shipment.orders?.email,
      shipment.carrier,
      shipment.tracking_number,
      shipment.status,
      shipment.last_location,
    ]),
  )

  return (
    <div>
      <PageHeader
        icon="🚚"
        title="Track Orders"
        description="Manage every customer delivery, UPS stage, estimated arrival, location and customer-facing update. Changes appear automatically on the customer’s private tracking page."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <PageSearch q={q} setQ={setQ} placeholder="Search order, customer or tracking…" />
            <button className={btnPrimary} onClick={() => setEditing('new')} disabled={orders.length === 0}>+ Add delivery</button>
          </div>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Summary label="All deliveries" value={rows.length} tone="cyan" />
        <Summary label="Out for delivery" value={rows.filter((row) => row.status === 'out_for_delivery').length} tone="amber" />
        <Summary label="Delivered" value={rows.filter((row) => row.status === 'delivered').length} tone="green" />
      </div>

      <div className="mb-5 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm leading-6 text-slate-300">
        <strong className="text-cyan-200">UPS customer timeline:</strong> Label Created → On the Way → Out for Delivery → Delivered. Use “Exception” for delays or unexpected events, and include a clear customer update and revised estimate.
      </div>
      <ErrorNote msg={error} />
      <Card>
        <table className={tableCls}>
          <thead className={theadCls}><tr><th className={thCls}>Order & customer</th><th className={thCls}>Tracking</th><th className={thCls}>Current progress</th><th className={thCls}>Estimate & location</th><th className={`${thCls} text-right`}>Actions</th></tr></thead>
          <tbody className={tbodyCls}>
            {loading ? <TableState colSpan={5} text="Loading deliveries…" /> : shown.length === 0 ? <TableState colSpan={5} text={q ? 'No matching deliveries.' : 'No deliveries yet.'} /> : shown.map((shipment) => {
              const historyCount = events.filter((event) => event.shipment_id === shipment.id).length
              return <tr key={shipment.id} className={trCls}>
                <td className="px-4 py-3"><div className="font-semibold text-white">#{shipment.orders?.order_number ?? shipment.order_id.slice(0, 8)}</div><div className="mt-1 text-xs text-slate-400">{shipment.orders?.ship_name || shipment.orders?.email || 'Customer'}</div></td>
                <td className="px-4 py-3"><div className="text-sm font-semibold text-slate-200">{shipment.carrier || 'UPS'}</div>{shipment.tracking_url || shipment.tracking_number ? <a href={shipment.tracking_url || upsTrackingUrl(shipment.tracking_number!)} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-cyan-300 hover:underline">{shipment.tracking_number || 'Open tracking'} ↗</a> : <div className="text-xs text-slate-500">No number yet</div>}</td>
                <td className="px-4 py-3"><StatusPill status={shipment.status} /><div className="mt-1 max-w-56 truncate text-xs text-slate-500">{shipment.status_detail || `${historyCount} history updates`}</div></td>
                <td className="px-4 py-3 text-xs"><div className="font-semibold text-slate-300">{shipment.estimated_delivery_at ? fmtDate(shipment.estimated_delivery_at) : 'Estimate pending'}</div><div className="mt-1 text-slate-500">{shipment.last_location || 'Location pending'}</div></td>
                <td className="whitespace-nowrap px-4 py-3 text-right"><button className={btnSmall} onClick={() => setEditing(shipment)}>Update</button><button className={`${btnSmall} ml-2 text-rose-300`} onClick={() => remove(shipment)}>Delete</button></td>
              </tr>
            })}
          </tbody>
        </table>
      </Card>

      {editing && <ShipmentForm row={editing === 'new' ? null : editing} orders={orders} events={editing === 'new' ? [] : events.filter((event) => event.shipment_id === editing.id)} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void refresh() }} />}
    </div>
  )
}

function ShipmentForm({ row, orders, events, onClose, onSaved }: { row: Shipment | null; orders: OrderOpt[]; events: TrackingEvent[]; onClose: () => void; onSaved: () => void }) {
  const [orderId, setOrderId] = useState(row?.order_id ?? orders[0]?.id ?? '')
  const [carrier, setCarrier] = useState(row?.carrier ?? 'UPS')
  const [trackingNumber, setTrackingNumber] = useState(row?.tracking_number ?? '')
  const [trackingUrl, setTrackingUrl] = useState(row?.tracking_url ?? '')
  const [status, setStatus] = useState<DeliveryStatus>(row?.status ?? 'label_created')
  const [estimate, setEstimate] = useState(row?.estimated_delivery_at ? localDateTime(row.estimated_delivery_at) : '')
  const [location, setLocation] = useState(row?.last_location ?? '')
  const [detail, setDetail] = useState(row?.status_detail ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!orderId) return setError('Choose an order.')
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const cleanNumber = trackingNumber.trim()
      const payload = {
        order_id: orderId,
        carrier: carrier.trim() || 'UPS',
        tracking_number: cleanNumber || null,
        tracking_url: trackingUrl.trim() || (cleanNumber ? upsTrackingUrl(cleanNumber) : null),
        status,
        status_detail: detail.trim() || null,
        last_location: location.trim() || null,
        estimated_delivery_at: estimate ? toTs(estimate) : null,
        shipped_at: row?.shipped_at ?? (status !== 'label_created' ? now : null),
        delivered_at: status === 'delivered' ? (row?.delivered_at ?? now) : null,
        updated_at: now,
      }
      let shipmentId = row?.id
      if (row) await updateRow('shipments', row.id, payload)
      else shipmentId = (await insertRowReturning<{ id: string }>('shipments', payload)).id

      await updateRow('orders', orderId, { fulfillment_status: status === 'delivered' ? 'delivered' : status === 'label_created' ? 'processing' : 'shipped' })
      await insertRow('tracking_events', { shipment_id: shipmentId, status, description: detail.trim() || statusName(status), location: location.trim() || null, event_at: now })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return <Modal title={row ? 'Update delivery' : 'Add delivery'} onClose={onClose} footer={<><button className={btnGhost} onClick={onClose} type="button">Cancel</button><button className={btnPrimary} form="delivery-form" disabled={saving}>{saving ? 'Publishing…' : 'Save & publish'}</button></>}>
    <form id="delivery-form" onSubmit={submit} className="grid gap-4">
      <ErrorNote msg={error} />
      <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs leading-5 text-emerald-200">This update will be visible only to the customer who owns the selected order.</div>
      <Field label="Order & customer"><select className={fieldCls} value={orderId} onChange={(event) => setOrderId(event.target.value)} disabled={Boolean(row)}>{orders.map((order) => <option key={order.id} value={order.id}>#{order.order_number ?? order.id.slice(0, 8)} · {order.ship_name || order.email || 'Customer'}</option>)}</select></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Carrier"><input className={fieldCls} value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder="UPS" /></Field><Field label="UPS stage"><select className={fieldCls} value={status} onChange={(event) => setStatus(event.target.value as DeliveryStatus)}>{STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field></div>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Tracking number"><input className={fieldCls} value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="1Z…" /></Field><Field label="Tracking URL (auto-created if blank)"><input className={fieldCls} value={trackingUrl} onChange={(event) => setTrackingUrl(event.target.value)} placeholder="https://www.ups.com/track…" /></Field></div>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Estimated delivery"><input className={fieldCls} type="datetime-local" value={estimate} onChange={(event) => setEstimate(event.target.value)} /></Field><Field label="Latest location"><input className={fieldCls} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Sofia, Bulgaria" /></Field></div>
      <Field label="Customer-facing delivery update"><textarea className={`${fieldCls} min-h-24 resize-y`} value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="Tell the customer what changed and what happens next…" /></Field>
      {events.length > 0 && <div><div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Previous updates</div><div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-slate-950/40 p-3">{events.map((event) => <div key={event.id} className="text-xs"><span className="font-bold text-slate-200">{statusName(event.status)}</span><span className="ml-2 text-slate-500">{fmtDate(event.event_at)}</span>{(event.description || event.location) && <div className="mt-0.5 text-slate-400">{event.description}{event.description && event.location ? ' · ' : ''}{event.location}</div>}</div>)}</div></div>}
    </form>
  </Modal>
}

function localDateTime(value: string) { const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16) }
function statusName(status: DeliveryStatus) { return STATUSES.find((item) => item.value === status)?.label ?? status }
function StatusPill({ status }: { status: DeliveryStatus }) { if (status === 'delivered') return <Pill tone="green">Delivered</Pill>; if (status === 'exception') return <Pill tone="amber">Exception</Pill>; return <Pill tone="cyan">{statusName(status)}</Pill> }
function Summary({ label, value, tone }: { label: string; value: number; tone: 'cyan' | 'amber' | 'green' }) { const colors = { cyan: 'border-cyan-400/20 bg-cyan-400/5 text-cyan-200', amber: 'border-amber-400/20 bg-amber-400/5 text-amber-200', green: 'border-emerald-400/20 bg-emerald-400/5 text-emerald-200' }; return <div className={`rounded-xl border p-4 ${colors[tone]}`}><div className="text-2xl font-black">{value}</div><div className="mt-1 text-xs font-semibold uppercase tracking-wide opacity-75">{label}</div></div> }
