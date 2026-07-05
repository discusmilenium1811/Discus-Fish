import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  PageHeader,
  ErrorNote,
  Card,
  Pill,
  TableState,
  btnSmall,
  tableCls,
  theadCls,
  thCls,
  tbodyCls,
  trCls,
} from '../components/ui'
import { PageSearch } from '../components/PageSearch'
import { useQuery, matchQuery } from '../lib/pageQuery'

type BusinessStatus = 'pending' | 'approved' | 'rejected'

interface BusinessAccount {
  id: string
  email: string | null
  username: string | null
  company_name: string | null
  vat_number: string | null
  contact_name: string | null
  phone: string | null
  country: string | null
  business_status: BusinessStatus
}

const tone = (s: BusinessStatus) =>
  s === 'approved' ? 'green' : s === 'rejected' ? 'rose' : 'amber'

export function BusinessAccounts() {
  const [rows, setRows] = useState<BusinessAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [q, setQ] = useQuery()

  async function refresh() {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('admin_list_business_accounts')
      if (error) throw error
      setRows((data ?? []) as BusinessAccount[])
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

  async function setStatus(id: string, status: BusinessStatus) {
    setBusyId(id)
    setError('')
    try {
      const { error } = await supabase.rpc('admin_set_business_status', {
        target: id,
        new_status: status,
      })
      if (error) throw error
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, business_status: status } : r)),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setBusyId('')
    }
  }

  const shown = rows.filter((r) =>
    matchQuery(q, [
      r.company_name,
      r.vat_number,
      r.email,
      r.contact_name,
      r.country,
      r.business_status,
    ]),
  )

  return (
    <div>
      <PageHeader
        icon="🏢"
        title="Business accounts"
        description="Approve or reject wholesale (business) accounts. Approved accounts see and pay the business prices; everyone else sees the normal prices."
        action={<PageSearch q={q} setQ={setQ} placeholder="Search company, VAT…" />}
      />
      <ErrorNote msg={error} />
      <Card>
        <table className={tableCls}>
          <thead className={theadCls}>
            <tr>
              <th className={thCls}>Company</th>
              <th className={thCls}>VAT</th>
              <th className={thCls}>Contact</th>
              <th className={thCls}>Country</th>
              <th className={thCls}>Status</th>
              <th className={`${thCls} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className={tbodyCls}>
            {loading ? (
              <TableState colSpan={6} text="Loading…" />
            ) : shown.length === 0 ? (
              <TableState
                colSpan={6}
                text={q ? 'No matching accounts.' : 'No business accounts yet.'}
              />
            ) : (
              shown.map((r) => (
                <tr key={r.id} className={trCls}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{r.company_name || '—'}</div>
                    <div className="text-xs text-slate-400">{r.email || r.username || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{r.vat_number || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">
                    <div>{r.contact_name || '—'}</div>
                    <div className="text-xs text-slate-500">{r.phone || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{r.country || '—'}</td>
                  <td className="px-4 py-3">
                    <Pill tone={tone(r.business_status) as 'green' | 'rose' | 'amber'}>
                      {r.business_status}
                    </Pill>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {r.business_status !== 'approved' && (
                        <button
                          className={btnSmall}
                          disabled={busyId === r.id}
                          onClick={() => setStatus(r.id, 'approved')}
                        >
                          Approve
                        </button>
                      )}
                      {r.business_status !== 'rejected' && (
                        <button
                          className={btnSmall}
                          disabled={busyId === r.id}
                          onClick={() => setStatus(r.id, 'rejected')}
                        >
                          Reject
                        </button>
                      )}
                      {r.business_status !== 'pending' && (
                        <button
                          className={btnSmall}
                          disabled={busyId === r.id}
                          onClick={() => setStatus(r.id, 'pending')}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
