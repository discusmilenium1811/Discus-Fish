import { useEffect, useState } from 'react'
import {
  fetchAll,
  insertRow,
  updateRow,
  deleteRow,
  eurosToCents,
  centsToEuros,
} from '../lib/adminApi'
import {
  resolveZone,
  weightBasedCost,
  type ShippingRateTier,
  type ShippingZone,
} from '../../lib/shipping'
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

interface Zone {
  id: string
  name: string
  countries: string[]
  is_active: boolean
  zone_code: string | null
  is_domestic: boolean
  over_kg_cents: number | null
}
interface Method {
  id: string
  zone_id: string | null
  name: string
  description: string
  price_cents: number
  free_over_cents: number | null
  estimated_days_min: number | null
  estimated_days_max: number | null
  is_active: boolean
  sort_order: number
}

export function Shipping() {
  const [zones, setZones] = useState<Zone[]>([])
  const [methods, setMethods] = useState<Method[]>([])
  const [tiers, setTiers] = useState<ShippingRateTier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [zoneEdit, setZoneEdit] = useState<Zone | 'new' | null>(null)
  const [methodEdit, setMethodEdit] = useState<Method | 'new' | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      const [z, m, r] = await Promise.all([
        fetchAll<Zone>('shipping_zones', '*', { col: 'name' }),
        fetchAll<Method>('shipping_methods', '*', { col: 'sort_order' }),
        fetchAll<ShippingRateTier>('shipping_rate_tiers', 'id, zone_id, max_weight_grams, price_cents', {
          col: 'max_weight_grams',
        }),
      ])
      setZones(z)
      setMethods(m)
      setTiers(r)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0)
    return () => window.clearTimeout(timer)
  }, [])

  const zoneName = (id: string | null) => zones.find((z) => z.id === id)?.name ?? '—'

  async function delZone(z: Zone) {
    if (!confirm(`Delete zone "${z.name}" and its methods?`)) return
    try {
      await deleteRow('shipping_zones', z.id)
      refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }
  async function delMethod(m: Method) {
    if (!confirm(`Delete method "${m.name}"?`)) return
    try {
      await deleteRow('shipping_methods', m.id)
      setMethods((list) => list.filter((x) => x.id !== m.id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  return (
    <div>
      <PageHeader
        icon="🌍"
        title="Shipping & Free Shipping"
        description="Manage the live delivery prices shown to customers on the Shipping Prices page."
      />
      <div className="mb-4 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-2.5 text-sm text-slate-300">
        🚚 <span className="font-semibold text-cyan-200">Carrier: UPS Express Saver · Origin: Cyprus · Customer-visible.</span>{' '}
        International delivery is priced <span className="font-semibold">by parcel weight</span> using the UPS
        rate table below: the destination country picks its UPS zone (e.g. DE → Zone 1, RS → Zone 5); any country
        not listed in a zone falls into <em>Zone 7</em> (Rest of world). <span className="font-semibold">Cyprus</span>{' '}
        stays a flat domestic rate (AKIS). Use the calculator to check any order.
      </div>
      <ErrorNote msg={error} />

      <ShippingCalculator zones={zones} methods={methods} tiers={tiers} />

      <RateMatrix zones={zones} tiers={tiers} />


      {/* Zones */}
      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Zones</h2>
        <button className={btnSmall} onClick={() => setZoneEdit('new')}>
          + Add zone
        </button>
      </div>
      <Card>
        <table className={tableCls}>
          <thead className={theadCls}>
            <tr>
              <th className={thCls}>Zone</th>
              <th className={thCls}>Countries</th>
              <th className={thCls}>Status</th>
              <th className={`${thCls} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tbodyCls}>
            {loading ? (
              <TableState colSpan={4} text="Loading…" />
            ) : zones.length === 0 ? (
              <TableState colSpan={4} text="No zones yet." />
            ) : (
              zones.map((z) => (
                <tr key={z.id} className={trCls}>
                  <td className="px-4 py-3 font-semibold text-white">
                    {z.name}
                    <div className="mt-1">
                      {z.is_domestic ? (
                        <Pill tone="green">Domestic · flat</Pill>
                      ) : (
                        <Pill tone="slate">
                          UPS {z.zone_code ? `Zone ${z.zone_code}` : '—'} · by weight
                          {z.over_kg_cents != null ? ` · +€${centsToEuros(z.over_kg_cents)}/kg` : ''}
                        </Pill>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {z.countries.length ? z.countries.join(', ') : 'Everywhere (Zone 7 fallback)'}
                  </td>
                  <td className="px-4 py-3">
                    {z.is_active ? <Pill tone="green">Active</Pill> : <Pill tone="slate">Off</Pill>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className={btnSmall} onClick={() => setZoneEdit(z)}>
                      Edit
                    </button>
                    <button className={`${btnSmall} ml-2 text-rose-300`} onClick={() => delZone(z)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Methods */}
      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Methods & free shipping
        </h2>
        <button className={btnSmall} onClick={() => setMethodEdit('new')} disabled={zones.length === 0}>
          + Add method
        </button>
      </div>
      <Card>
        <table className={tableCls}>
          <thead className={theadCls}>
            <tr>
              <th className={thCls}>Method</th>
              <th className={thCls}>Zone</th>
              <th className={thCls}>Price</th>
              <th className={thCls}>Free over</th>
              <th className={thCls}>Delivery</th>
              <th className={thCls}>Status</th>
              <th className={`${thCls} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tbodyCls}>
            {loading ? (
              <TableState colSpan={7} text="Loading…" />
            ) : methods.length === 0 ? (
              <TableState colSpan={7} text="No methods yet." />
            ) : (
              methods.map((m) => (
                <tr key={m.id} className={trCls}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{m.name}</div>
                    <div className="text-xs text-slate-500">{m.description}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{zoneName(m.zone_id)}</td>
                  <td className="px-4 py-3 text-slate-200">
                    {zones.find((z) => z.id === m.zone_id)?.is_domestic
                      ? `€${centsToEuros(m.price_cents)}`
                      : <Pill tone="slate">By weight</Pill>}
                  </td>
                  <td className="px-4 py-3">
                    {zones.find((z) => z.id === m.zone_id)?.is_domestic && m.free_over_cents != null ? (
                      <Pill tone="cyan">€{centsToEuros(m.free_over_cents)}</Pill>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {m.estimated_days_min != null
                      ? `${m.estimated_days_min}–${m.estimated_days_max ?? m.estimated_days_min} days`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {m.is_active ? <Pill tone="green">Active</Pill> : <Pill tone="slate">Off</Pill>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className={btnSmall} onClick={() => setMethodEdit(m)}>
                      Edit
                    </button>
                    <button className={`${btnSmall} ml-2 text-rose-300`} onClick={() => delMethod(m)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {zoneEdit && (
        <ZoneForm
          row={zoneEdit === 'new' ? null : zoneEdit}
          onClose={() => setZoneEdit(null)}
          onSaved={() => {
            setZoneEdit(null)
            refresh()
          }}
        />
      )}
      {methodEdit && (
        <MethodForm
          row={methodEdit === 'new' ? null : methodEdit}
          zones={zones}
          onClose={() => setMethodEdit(null)}
          onSaved={() => {
            setMethodEdit(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}

function ShippingCalculator({
  zones,
  methods,
  tiers,
}: {
  zones: Zone[]
  methods: Method[]
  tiers: ShippingRateTier[]
}) {
  const [country, setCountry] = useState('DE')
  const [weightKg, setWeightKg] = useState('2')
  const [subtotal, setSubtotal] = useState('40.00')

  const code = country.trim().toUpperCase()
  const grams = Math.max(0, Math.round(Number(weightKg || 0) * 1000))
  const subtotalCents = Math.round(Number(subtotal || 0) * 100)

  const zone = resolveZone(zones as ShippingZone[], code)
  const method = zone
    ? methods
        .filter((m) => m.zone_id === zone.id && m.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)[0] ?? null
    : null

  const isDomestic = zone?.is_domestic ?? false
  const costCents = !zone
    ? null
    : isDomestic
      ? method
        ? method.free_over_cents != null && subtotalCents >= method.free_over_cents
          ? 0
          : method.price_cents
        : null
      : weightBasedCost(zone as ShippingZone, tiers, grams)
  const matchedTier = zone && !isDomestic
    ? tiers
        .filter((t) => t.zone_id === zone.id)
        .sort((a, b) => a.max_weight_grams - b.max_weight_grams)
        .find((t) => grams <= t.max_weight_grams) ?? null
    : null

  return (
    <Card>
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          🧮 Shipping cost calculator
        </h2>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-3">
        <Field label="Destination country code">
          <input
            className={fieldCls}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="CY, DE, GB, US…"
          />
        </Field>
        <Field label="Parcel weight (kg)">
          <input
            className={fieldCls}
            type="number"
            step="0.1"
            min="0"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
        </Field>
        <Field label="Order subtotal (€) — for Cyprus free-shipping">
          <input
            className={fieldCls}
            type="number"
            step="0.01"
            value={subtotal}
            onChange={(e) => setSubtotal(e.target.value)}
          />
        </Field>
      </div>
      <div className="px-4 pb-4">
        {!code ? (
          <p className="text-sm text-slate-500">Enter a destination country code.</p>
        ) : !zone ? (
          <p className="text-sm text-amber-300">
            No active zone matches “{code}” and there is no Zone 7 (empty-countries) fallback.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="text-slate-400">
              Zone:{' '}
              <span className="font-semibold text-white">
                {zone.name}
                {zone.is_domestic ? ' (flat)' : ` · by weight`}
              </span>
            </span>
            {!isDomestic && (
              <span className="text-slate-400">
                Weight bracket:{' '}
                <span className="font-semibold text-white">
                  {matchedTier ? `≤ ${matchedTier.max_weight_grams / 1000} kg` : `> top tier (+ per-kg)`}
                </span>
              </span>
            )}
            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-sm font-bold text-cyan-200">
              Shipping: {costCents == null ? 'n/a' : costCents === 0 ? 'FREE' : `€${centsToEuros(costCents)}`}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}

/** Read-only UPS rate matrix: weight brackets (rows) × UPS zones (columns). */
function RateMatrix({ zones, tiers }: { zones: Zone[]; tiers: ShippingRateTier[] }) {
  const upsZones = zones
    .filter((z) => !z.is_domestic)
    .sort((a, b) => Number(a.zone_code) - Number(b.zone_code))
  const weights = [...new Set(tiers.map((t) => t.max_weight_grams))].sort((a, b) => a - b)
  const priceOf = (zoneId: string, grams: number) =>
    tiers.find((t) => t.zone_id === zoneId && t.max_weight_grams === grams)?.price_cents ?? null

  if (upsZones.length === 0 || weights.length === 0) return null

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          UPS Express Saver rate table (€ by parcel weight)
        </h2>
        <span className="text-xs text-slate-500">Managed from the UPS contract rate sheet</span>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className={tableCls}>
            <thead className={theadCls}>
              <tr>
                <th className={thCls}>Up to (kg)</th>
                {upsZones.map((z) => (
                  <th key={z.id} className={`${thCls} text-right`}>
                    {z.zone_code ? `Zone ${z.zone_code}` : z.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={tbodyCls}>
              {weights.map((grams) => (
                <tr key={grams} className={trCls}>
                  <td className="px-4 py-2 font-semibold text-white">{grams / 1000}</td>
                  {upsZones.map((z) => {
                    const cents = priceOf(z.id, grams)
                    return (
                      <td key={z.id} className="px-4 py-2 text-right text-slate-200">
                        {cents == null ? '—' : centsToEuros(cents)}
                      </td>
                    )
                  })}
                </tr>
              ))}
              <tr className={trCls}>
                <td className="px-4 py-2 font-semibold text-cyan-200">+ per extra kg</td>
                {upsZones.map((z) => (
                  <td key={z.id} className="px-4 py-2 text-right text-cyan-200">
                    {z.over_kg_cents == null ? '—' : centsToEuros(z.over_kg_cents)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function ZoneForm({
  row,
  onClose,
  onSaved,
}: {
  row: Zone | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(row?.name ?? '')
  const [countries, setCountries] = useState((row?.countries ?? []).join(', '))
  const [zoneCode, setZoneCode] = useState(row?.zone_code ?? '')
  const [isDomestic, setIsDomestic] = useState(row?.is_domestic ?? false)
  const [overKg, setOverKg] = useState(centsToEuros(row?.over_kg_cents))
  const [isActive, setIsActive] = useState(row?.is_active ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Name is required.')
    const payload = {
      name: name.trim(),
      countries: countries
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean),
      zone_code: zoneCode.trim() || null,
      is_domestic: isDomestic,
      over_kg_cents: !isDomestic && overKg ? eurosToCents(overKg) : null,
      is_active: isActive,
    }
    setSaving(true)
    try {
      if (row) await updateRow('shipping_zones', row.id, payload)
      else await insertRow('shipping_zones', payload)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={row ? 'Edit zone' : 'New zone'}
      onClose={onClose}
      footer={
        <>
          <button className={btnGhost} onClick={onClose} type="button">
            Cancel
          </button>
          <button className={btnPrimary} form="zone-form" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="zone-form" onSubmit={submit} className="grid gap-4">
        <ErrorNote msg={error} />
        <Field label="Zone name">
          <input className={fieldCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Europe" />
        </Field>
        <Field label="Country codes (comma-separated, blank = everywhere / Zone 7 fallback)">
          <input className={fieldCls} value={countries} onChange={(e) => setCountries(e.target.value)} placeholder="GR, BG, CY, DE" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="UPS zone code (1–7, 701) or CY">
            <input className={fieldCls} value={zoneCode} onChange={(e) => setZoneCode(e.target.value)} placeholder="1" />
          </Field>
          <Field label="Per extra kg (€) — above top weight tier">
            <input className={fieldCls} type="number" step="0.01" value={overKg} disabled={isDomestic} onChange={(e) => setOverKg(e.target.value)} placeholder="3.20" />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={isDomestic} onChange={(e) => setIsDomestic(e.target.checked)} className="h-4 w-4 accent-cyan-400" />
          Domestic (flat method price — not weight-based; e.g. Cyprus)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-cyan-400" />
          Active
        </label>
      </form>
    </Modal>
  )
}

function MethodForm({
  row,
  zones,
  onClose,
  onSaved,
}: {
  row: Method | null
  zones: Zone[]
  onClose: () => void
  onSaved: () => void
}) {
  const [zoneId, setZoneId] = useState(row?.zone_id ?? zones[0]?.id ?? '')
  const [name, setName] = useState(row?.name ?? '')
  const [description, setDescription] = useState(row?.description ?? '')
  const [price, setPrice] = useState(centsToEuros(row?.price_cents ?? 0))
  const [freeOver, setFreeOver] = useState(centsToEuros(row?.free_over_cents))
  const [daysMin, setDaysMin] = useState(row?.estimated_days_min != null ? String(row.estimated_days_min) : '')
  const [daysMax, setDaysMax] = useState(row?.estimated_days_max != null ? String(row.estimated_days_max) : '')
  const [sortOrder, setSortOrder] = useState(String(row?.sort_order ?? 0))
  const [isActive, setIsActive] = useState(row?.is_active ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Name is required.')
    const payload = {
      zone_id: zoneId || null,
      name: name.trim(),
      description: description.trim(),
      price_cents: eurosToCents(price || 0),
      free_over_cents: freeOver ? eurosToCents(freeOver) : null,
      estimated_days_min: daysMin ? parseInt(daysMin, 10) : null,
      estimated_days_max: daysMax ? parseInt(daysMax, 10) : null,
      sort_order: parseInt(sortOrder, 10) || 0,
      is_active: isActive,
    }
    setSaving(true)
    try {
      if (row) await updateRow('shipping_methods', row.id, payload)
      else await insertRow('shipping_methods', payload)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={row ? 'Edit method' : 'New method'}
      onClose={onClose}
      footer={
        <>
          <button className={btnGhost} onClick={onClose} type="button">
            Cancel
          </button>
          <button className={btnPrimary} form="method-form" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="method-form" onSubmit={submit} className="grid gap-4">
        <ErrorNote msg={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Zone">
            <select className={fieldCls} value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Method name">
            <input className={fieldCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Standard" />
          </Field>
        </div>
        <Field label="Description">
          <input className={fieldCls} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tracked delivery" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (€)">
            <input className={fieldCls} type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
          <Field label="Free over (€) — leave blank for never">
            <input className={fieldCls} type="number" step="0.01" placeholder="e.g. 35.00" value={freeOver} onChange={(e) => setFreeOver(e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Days (min)">
            <input className={fieldCls} type="number" value={daysMin} onChange={(e) => setDaysMin(e.target.value)} />
          </Field>
          <Field label="Days (max)">
            <input className={fieldCls} type="number" value={daysMax} onChange={(e) => setDaysMax(e.target.value)} />
          </Field>
          <Field label="Sort order">
            <input className={fieldCls} type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-cyan-400" />
          Active
        </label>
      </form>
    </Modal>
  )
}
