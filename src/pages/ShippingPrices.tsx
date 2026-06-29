import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { supabase } from '../lib/supabase'
import {
  fetchPublicShippingRates,
  type ShippingMethod,
  type ShippingRates,
  type ShippingZone,
} from '../lib/shipping'

const EMPTY_RATES: ShippingRates = { zones: [], methods: [] }

function money(cents: number, language: string) {
  return new Intl.NumberFormat(language, { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export function ShippingPrices() {
  const { t, lang } = useTranslation()
  const [rates, setRates] = useState<ShippingRates>(EMPTY_RATES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const locale = lang === 'el' ? 'el-GR' : lang === 'bg' ? 'bg-BG' : 'en-GB'

  const loadRates = useCallback(async () => {
    try {
      setRates(await fetchPublicShippingRates())
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadRates(), 0)

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void loadRates()
    }
    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    const timer = window.setInterval(() => void loadRates(), 30_000)
    const channel = supabase
      .channel('public-shipping-rates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipping_zones' }, () => void loadRates())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipping_methods' }, () => void loadRates())
      .subscribe()

    return () => {
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.clearTimeout(initialLoad)
      window.clearInterval(timer)
      void supabase.removeChannel(channel)
    }
  }, [loadRates])

  return (
    <section className="relative min-h-[70vh] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.16),transparent_36%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_32%),linear-gradient(to_bottom,rgba(2,6,23,0.92),rgba(2,6,23,0.98))]" />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-18">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-3xl shadow-[0_0_35px_rgba(34,211,238,0.15)]">🚚</div>
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-cyan-300">{t('shipping.eyebrow')}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">{t('shipping.heading')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{t('shipping.intro')}</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-200 sm:text-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
            {t('shipping.live')}
          </div>
        </div>

        <div className="mt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">{t('shipping.ratesEyebrow')}</p>
              <h2 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">{t('shipping.ratesTitle')}</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">{t('shipping.origin')}</span>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {[0, 1, 2, 3].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/5" />)}
            </div>
          ) : error ? (
            <MessageCard text={t('shipping.error')} action={t('shipping.retry')} onAction={() => { setLoading(true); void loadRates() }} />
          ) : rates.zones.length === 0 ? (
            <MessageCard text={t('shipping.empty')} />
          ) : (
            <div className="grid items-start gap-5 md:grid-cols-2">
              {rates.zones.map((zone) => (
                <ZoneCard
                  key={zone.id}
                  zone={zone}
                  methods={rates.methods.filter((method) => method.zone_id === zone.id)}
                  locale={locale}
                  labels={{
                    everywhere: t('shipping.everywhere'),
                    free: t('shipping.free'),
                    freeOver: t('shipping.freeOver'),
                    delivery: t('shipping.delivery'),
                    days: t('shipping.days'),
                    noMethods: t('shipping.noMethods'),
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <InfoCard icon="📦" title={t('shipping.packingTitle')} text={t('shipping.packingText')} />
          <InfoCard icon="📍" title={t('shipping.trackingTitle')} text={t('shipping.trackingText')} />
          <InfoCard icon="🌍" title={t('shipping.customsTitle')} text={t('shipping.customsText')} />
        </div>

        <div className="mt-8 rounded-2xl border border-amber-300/15 bg-amber-300/5 p-5 text-sm leading-6 text-slate-300 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <p><span className="font-bold text-amber-200">{t('shipping.noteTitle')}</span> {t('shipping.noteText')}</p>
          <Link to="/contact" className="mt-4 inline-flex shrink-0 items-center font-bold text-cyan-300 hover:text-cyan-200 sm:mt-0">{t('shipping.contact')} →</Link>
        </div>
      </div>
    </section>
  )
}

function ZoneCard({ zone, methods, locale, labels }: { zone: ShippingZone; methods: ShippingMethod[]; locale: string; labels: Record<string, string> }) {
  const displayNames = new Intl.DisplayNames([locale], { type: 'region' })
  const countries = zone.countries.length
    ? zone.countries.map((code) => displayNames.of(code.toUpperCase()) ?? code).join(' · ')
    : labels.everywhere

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 shadow-xl shadow-slate-950/20 backdrop-blur-md transition hover:border-cyan-300/25">
      <div className="border-b border-white/10 bg-gradient-to-r from-cyan-400/10 to-emerald-400/5 p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-xl">🌐</span>
          <div>
            <h3 className="text-lg font-extrabold text-white">{zone.name}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">{countries}</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-white/10 px-5">
        {methods.length === 0 ? (
          <p className="py-6 text-sm text-slate-500">{labels.noMethods}</p>
        ) : methods.map((method) => (
          <div key={method.id} className="grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h4 className="font-bold text-white">{method.name}</h4>
              {method.description && <p className="mt-1 text-xs leading-5 text-slate-400">{method.description}</p>}
              {method.estimated_days_min != null && (
                <p className="mt-2 text-xs font-semibold text-cyan-200">⏱ {labels.delivery}: {method.estimated_days_min}–{method.estimated_days_max ?? method.estimated_days_min} {labels.days}</p>
              )}
            </div>
            <div className="sm:text-right">
              <div className="text-xl font-black text-white">{method.price_cents === 0 ? labels.free : money(method.price_cents, locale)}</div>
              {method.free_over_cents != null && (
                <div className="mt-1 text-xs font-bold text-emerald-300">{labels.freeOver} {money(method.free_over_cents, locale)}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

function InfoCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"><span className="text-2xl">{icon}</span><h3 className="mt-3 font-extrabold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></div>
}

function MessageCard({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-300">{text}{action && <button type="button" onClick={onAction} className="ml-3 font-bold text-cyan-300 hover:text-cyan-200">{action}</button>}</div>
}
