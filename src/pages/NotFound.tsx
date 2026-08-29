import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'

/** Catch-all route: a deliberate 404 rather than a blank screen. */
export function NotFound() {
  const { t } = useTranslation()

  return (
    <section className="relative min-h-[70vh] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.16),transparent_36%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_32%),linear-gradient(to_bottom,rgba(2,6,23,0.92),rgba(2,6,23,0.98))]" />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <span className="text-6xl">🐟</span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">404</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{t('notFound.title')}</h1>
        <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">{t('notFound.text')}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:brightness-110"
          >
            {t('notFound.home')}
          </Link>
          <Link
            to="/Cataloge/Products"
            className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-200"
          >
            {t('notFound.catalog')}
          </Link>
        </div>
      </div>
    </section>
  )
}
