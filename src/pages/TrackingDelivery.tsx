import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'
import { supabase } from '../lib/supabase'
import {
  fetchMyDeliveries,
  upsTrackingUrl,
  type CustomerDelivery,
  type DeliveryStatus,
} from '../lib/tracking'
import type { TranslationKey } from '../i18n/translations'

const STEPS: { status: DeliveryStatus | 'processing'; label: TranslationKey; text: TranslationKey; icon: string }[] = [
  { status: 'processing', label: 'tracking.status.processing', text: 'tracking.status.processingText', icon: '✓' },
  { status: 'label_created', label: 'tracking.status.label', text: 'tracking.status.labelText', icon: '🏷️' },
  { status: 'on_the_way', label: 'tracking.status.way', text: 'tracking.status.wayText', icon: '🚚' },
  { status: 'out_for_delivery', label: 'tracking.status.out', text: 'tracking.status.outText', icon: '📍' },
  { status: 'delivered', label: 'tracking.status.delivered', text: 'tracking.status.deliveredText', icon: '🏠' },
]

const PROGRESS: Record<DeliveryStatus, number> = {
  label_created: 1,
  on_the_way: 2,
  out_for_delivery: 3,
  access_point: 4,
  delivered: 4,
  exception: 2,
}

export function TrackingDelivery() {
  const { t, lang } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [deliveries, setDeliveries] = useState<CustomerDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const locale = lang === 'el' ? 'el-GR' : lang === 'bg' ? 'bg-BG' : 'en-GB'

  const load = useCallback(async () => {
    if (!user) {
      setDeliveries([])
      setLoading(false)
      return
    }
    try {
      setDeliveries(await fetchMyDeliveries(user.id))
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    const initialLoad = window.setTimeout(() => void load(), 0)
    const refresh = () => {
      if (document.visibilityState === 'visible') void load()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    const timer = window.setInterval(() => void load(), 30_000)
    const channel = supabase
      .channel(`customer-deliveries-${user?.id ?? 'guest'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracking_events' }, () => void load())
      .subscribe()
    return () => {
      window.clearTimeout(initialLoad)
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
      void supabase.removeChannel(channel)
    }
  }, [authLoading, load, user?.id])

  return (
    <section className="relative min-h-[72vh] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(6,182,212,0.18),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(59,130,246,0.12),transparent_30%),linear-gradient(to_bottom,rgba(2,6,23,0.91),rgba(2,6,23,0.98))]" />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-18">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-3xl shadow-[0_0_35px_rgba(34,211,238,0.16)]">📦</div>
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-cyan-300">{t('tracking.eyebrow')}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">{t('tracking.heading')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{t('tracking.intro')}</p>
          {user && <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-200"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />{t('tracking.live')}</div>}
        </div>

        <div className="mt-12">
          {authLoading || loading ? <LoadingCards /> : !user ? (
            <StateCard icon="🔒" title={t('tracking.signInTitle')} text={t('tracking.signInText')} />
          ) : error ? (
            <StateCard icon="⚠️" title={t('tracking.errorTitle')} text={t('tracking.errorText')} action={t('tracking.retry')} onAction={() => { setLoading(true); void load() }} />
          ) : deliveries.length === 0 ? (
            <StateCard icon="📭" title={t('tracking.emptyTitle')} text={t('tracking.emptyText')} />
          ) : (
            <div className="space-y-6">
              {deliveries.map((delivery) => <DeliveryCard key={delivery.order.id} delivery={delivery} locale={locale} />)}
            </div>
          )}
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-400 backdrop-blur-md">
          <span className="font-bold text-white">{t('tracking.upsNoteTitle')}</span> {t('tracking.upsNote')}{' '}
          <a href="https://www.ups.com/track" target="_blank" rel="noreferrer" className="font-bold text-cyan-300 hover:text-cyan-200">{t('tracking.upsSite')} ↗</a>
        </div>
      </div>
    </section>
  )
}

function DeliveryCard({ delivery, locale }: { delivery: CustomerDelivery; locale: string }) {
  const { t } = useTranslation()
  const { order, shipment, events } = delivery
  const status = shipment?.status ?? null
  const progress = status ? PROGRESS[status] : 0
  const isException = status === 'exception'
  const isAccessPoint = status === 'access_point'
  const activeStep = status && !isException && !isAccessPoint
    ? STEPS.find((step) => step.status === status)
    : !status ? STEPS[0] : null
  const stageExplanation = isAccessPoint
    ? t('tracking.status.accessPointText')
    : activeStep ? t(activeStep.text) : null
  const trackingUrl = shipment?.tracking_url || (shipment?.tracking_number ? upsTrackingUrl(shipment.tracking_number) : null)
  const date = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-cyan-400/10 via-transparent to-blue-400/10 p-5 sm:p-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t('tracking.order')}</p>
          <h2 className="mt-1 text-xl font-black text-white">#{order.order_number ?? order.id.slice(0, 8)}</h2>
          <p className="mt-1 text-xs text-slate-500">{t('tracking.placed')} {date(order.created_at)}</p>
        </div>
        <div className={`rounded-full border px-4 py-2 text-xs font-extrabold ${isException ? 'border-amber-300/30 bg-amber-300/10 text-amber-200' : status === 'delivered' ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200' : 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200'}`}>
          {isException ? t('tracking.status.exception') : isAccessPoint ? t('tracking.status.accessPoint') : status ? t(STEPS.find((step) => step.status === status)?.label ?? 'tracking.status.way') : t('tracking.status.processing')}
        </div>
      </div>

      <div className="p-5 sm:p-7">
        {isException && <div className="mb-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100"><strong>{t('tracking.attention')}</strong> {shipment?.status_detail || t('tracking.exceptionFallback')}</div>}

        <div className="grid grid-cols-5 gap-1 sm:gap-3">
          {STEPS.map((step, index) => {
            const done = index <= progress
            const active = index === progress && status !== 'delivered'
            const finalLabel = index === 4 && isAccessPoint ? t('tracking.status.accessPoint') : t(step.label)
            return <div key={step.status} className="relative text-center">
              {index < STEPS.length - 1 && <div className={`absolute left-[55%] top-5 h-0.5 w-[90%] ${index < progress ? 'bg-cyan-400' : 'bg-slate-700'}`} />}
              <div className={`relative mx-auto grid h-10 w-10 place-items-center rounded-full border text-sm transition sm:h-12 sm:w-12 sm:text-base ${done ? 'border-cyan-300 bg-cyan-300 text-slate-950 shadow-[0_0_18px_rgba(103,232,249,0.24)]' : 'border-white/10 bg-slate-800 text-slate-500'} ${active ? 'ring-4 ring-cyan-300/10' : ''}`}>{step.icon}</div>
              <p className={`mt-2 hidden text-[0.65rem] font-bold leading-4 sm:block sm:text-xs ${done ? 'text-white' : 'text-slate-500'}`}>{finalLabel}</p>
            </div>
          })}
        </div>

        {stageExplanation && <div className="mx-auto mt-5 max-w-2xl rounded-xl border border-cyan-300/15 bg-cyan-300/5 px-4 py-3 text-center text-sm leading-6 text-slate-300">{stageExplanation}</div>}

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label={t('tracking.eta')} value={shipment?.estimated_delivery_at ? date(shipment.estimated_delivery_at) : t('tracking.pending')} icon="🗓️" />
          <Detail label={t('tracking.location')} value={shipment?.last_location || t('tracking.pending')} icon="📍" />
          <Detail label={t('tracking.destination')} value={[order.ship_city, order.ship_country].filter(Boolean).join(', ') || t('tracking.pending')} icon="🏠" />
          <Detail label={t('tracking.carrier')} value={shipment?.carrier || 'UPS'} icon="🚚" />
        </div>

        {shipment?.status_detail && !isException && <p className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300">{shipment.status_detail}</p>}

        {(shipment?.tracking_number || trackingUrl) && <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <div><p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">{t('tracking.number')}</p><p className="mt-1 font-mono text-sm font-bold text-white">{shipment?.tracking_number}</p></div>
          {trackingUrl && <a href={trackingUrl} target="_blank" rel="noreferrer" className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-extrabold text-slate-950 transition hover:bg-cyan-200">{t('tracking.openUps')} ↗</a>}
        </div>}

        {events.length > 0 && <details className="mt-6 group"><summary className="cursor-pointer list-none text-sm font-bold text-cyan-300">{t('tracking.history')} <span className="ml-1 inline-block transition group-open:rotate-180">⌄</span></summary><div className="mt-4 space-y-3 border-l border-white/10 pl-4">{events.map((event) => <div key={event.id}><div className="flex flex-wrap items-center gap-2"><span className="font-bold text-white">{statusLabel(event.status, t)}</span><time className="text-xs text-slate-500">{date(event.event_at)}</time></div>{(event.description || event.location) && <p className="mt-1 text-xs leading-5 text-slate-400">{event.description}{event.description && event.location ? ' · ' : ''}{event.location}</p>}</div>)}</div></details>}
      </div>
    </article>
  )
}

function statusLabel(status: DeliveryStatus, t: ReturnType<typeof useTranslation>['t']) {
  const keys: Record<DeliveryStatus, TranslationKey> = { label_created: 'tracking.status.label', on_the_way: 'tracking.status.way', out_for_delivery: 'tracking.status.out', access_point: 'tracking.status.accessPoint', delivered: 'tracking.status.delivered', exception: 'tracking.status.exception' }
  return t(keys[status])
}

function Detail({ label, value, icon }: { label: string; value: string; icon: string }) { return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span>{icon}</span><p className="mt-2 text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-bold leading-5 text-white">{value}</p></div> }
function LoadingCards() { return <div className="space-y-5">{[0, 1].map((item) => <div key={item} className="h-80 animate-pulse rounded-3xl border border-white/10 bg-white/5" />)}</div> }
function StateCard({ icon, title, text, action, onAction }: { icon: string; title: string; text: string; action?: string; onAction?: () => void }) { return <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md"><div className="text-4xl">{icon}</div><h2 className="mt-4 text-xl font-extrabold text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>{action && <button type="button" onClick={onAction} className="mt-5 rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-bold text-slate-950">{action}</button>}</div> }
