import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { useAuth } from '../auth/AuthContext'

interface NavbarProps {
  cartCount: number
  onCartClick: () => void
  onAccountClick: () => void
  onLanguageClick: () => void
  onCatalogClick: () => void
}

export function Navbar({
  cartCount,
  onCartClick,
  onAccountClick,
  onLanguageClick,
  onCatalogClick,
}: NavbarProps) {
  const { t, lang } = useTranslation()
  const { user, profile } = useAuth()
  const accountName = profile?.username ?? user?.email

  return (
    <>
      <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center gap-4 sm:gap-8">
            <Link
              to="/"
              className="flex shrink-0 items-center"
              aria-label="Go to main page"
            >
              <img
                src="/pictures/Logo/viber_image_2026-06-20_16-16-33-937.jpg"
                alt="DiscusFish logo"
                className="h-28 w-auto rounded-2xl object-contain shadow-sm sm:h-36"
              />
            </Link>

            {accountName && (
              <div className="min-w-0 text-left">
                <div className="text-xs font-semibold text-slate-400 sm:text-base">{t('nav.welcome')}</div>
                <div className="max-w-28 truncate text-base font-extrabold text-white sm:max-w-36 sm:text-2xl">
                  {accountName}
                </div>
              </div>
            )}

            <p className="min-w-[11rem] flex-1 bg-gradient-to-r from-orange-300 via-cyan-200 via-45% to-teal-300 bg-clip-text text-2xl font-black leading-tight text-transparent drop-shadow-[0_0_18px_rgba(34,211,238,0.22)] sm:min-w-[14rem] sm:text-5xl lg:text-6xl">
              {t('nav.tagline')}
            </p>
          </div>

          <div className="relative flex flex-wrap items-center justify-center gap-2 sm:gap-3.5">
          <Link
            to="/shipping-prices"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group relative order-first flex h-10 w-full items-center justify-center gap-2.5 overflow-hidden rounded-full border border-cyan-300/30 bg-gradient-to-r from-cyan-400/15 via-white/5 to-emerald-400/15 px-4 text-[0.62rem] font-extrabold uppercase tracking-[0.11em] text-white shadow-[0_8px_25px_rgba(6,182,212,0.1)] transition hover:border-cyan-300/60 hover:bg-white/10 sm:absolute sm:left-1/2 sm:h-12 sm:w-fit sm:-translate-x-1/2 sm:flex-none sm:justify-start sm:text-xs"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cyan-300 text-sm shadow-[0_0_15px_rgba(103,232,249,0.4)] transition group-hover:scale-105 sm:h-8 sm:w-8 sm:text-base" aria-hidden="true">
              🚚
            </span>
            <span className="whitespace-nowrap">{t('nav.freeDelivery')}</span>
          </Link>

          <button
            type="button"
            onClick={onAccountClick}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-bold text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white sm:ml-auto sm:h-12 sm:px-5 sm:text-base"
            aria-label={t('nav.account')}
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-cyan-300/15 text-[0.65rem] text-cyan-200" aria-hidden="true">👤</span>
            <span>{t('nav.account')}</span>
          </button>

          <button
            type="button"
            onClick={onLanguageClick}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-bold text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white sm:h-12 sm:px-5 sm:text-base"
            aria-label={t('nav.language')}
          >
            <span className="uppercase">{lang}</span>
          </button>
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-2.5 sm:px-6 sm:py-4">
          <nav className="relative grid w-full grid-cols-6 items-center gap-1.5 text-center text-[0.65rem] font-semibold text-slate-300 sm:flex sm:justify-center sm:gap-8 sm:text-lg">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="transition hover:text-cyan-300 focus:outline-none"
            >
              {t('nav.home')}
            </Link>
            <button
              type="button"
              onClick={onCatalogClick}
              className="transition hover:text-cyan-300"
            >
              {t('nav.catalog')}
            </button>
            <Link
              to="/why-us"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="transition hover:text-cyan-300"
            >
              {t('nav.whyUs')}
            </Link>
            <Link
              to="/contact"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="transition hover:text-cyan-300"
            >
              {t('nav.contact')}
            </Link>
            <button
              type="button"
              onClick={onCartClick}
              className="relative inline-flex h-8 items-center justify-center rounded-full border border-white/15 bg-white/5 px-2 font-bold text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white sm:absolute sm:right-0 sm:h-10 sm:px-5 sm:text-base"
            >
              <span className="text-xl leading-none sm:text-2xl" aria-hidden="true">🛒</span>
              <span className="sr-only">{t('nav.cart')}</span>
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
            <Link
              to="/tracking-delivery"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="transition hover:text-cyan-300 focus:outline-none"
            >
              {t('nav.trackingDelivery')}
            </Link>
          </nav>
        </div>
      </div>
    </>
  )
}
