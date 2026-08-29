import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { useAuth } from '../auth/AuthContext'
import { PARTNER_LOGO, PARTNER_LOGO_ALT } from '../lib/branding'

interface NavbarProps {
  cartCount: number
  onCartClick: () => void
  onLoginClick: () => void
  onAccountClick: () => void
  onLanguageClick: () => void
  onCatalogClick: () => void
}

export function Navbar({
  cartCount,
  onCartClick,
  onLoginClick,
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
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5">
          {/* Both logos and the tagline share one row, so the tagline simply
              gets the space that is left instead of running underneath them. */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              to="/"
              className="flex shrink-0 items-center"
              aria-label="Go to main page"
            >
              <img
                src="/pictures/Logo/viber_image_2026-06-20_16-16-33-937.jpg"
                alt="DiscusFish logo"
                className="h-16 w-16 rounded-2xl object-contain shadow-sm sm:h-24 sm:w-24 lg:h-32 lg:w-32 xl:h-36 xl:w-36"
              />
            </Link>

            <p className="min-w-0 flex-1 text-balance bg-gradient-to-r from-orange-300 via-cyan-200 via-45% to-teal-300 bg-clip-text text-center text-lg font-black leading-tight text-transparent drop-shadow-[0_0_18px_rgba(34,211,238,0.22)] sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
              {t('nav.tagline')}
            </p>

            <div className="flex w-16 shrink-0 flex-col items-center sm:w-24 lg:w-32 xl:w-36">
              <img
                src={PARTNER_LOGO}
                alt={PARTNER_LOGO_ALT}
                className="h-16 w-16 rounded-2xl object-contain shadow-sm sm:h-24 sm:w-24 lg:h-32 lg:w-32 xl:h-36 xl:w-36"
              />
              <p className="mt-1.5 text-center text-[0.55rem] leading-3 text-slate-400 sm:mt-2 sm:text-[0.65rem] sm:leading-4 lg:text-xs lg:leading-5">
                {t('footer.partner')}
              </p>
            </div>
          </div>

          {/* Own row, so a long username never crowds the tagline. */}
          {accountName && (
            <div className="mt-3 text-center sm:mt-4">
              <div className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-[0.7rem]">
                {t('nav.welcome')}
              </div>
              <div className="mt-0.5 break-words text-xs font-bold text-white sm:text-sm">
                {accountName}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-2.5 sm:px-6 sm:py-4">
          <nav className="relative flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-[0.65rem] font-semibold text-slate-300 sm:gap-8 sm:text-lg">
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
              className="cursor-pointer transition hover:text-cyan-300"
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
            <Link
              to="/tracking-delivery"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="transition hover:text-cyan-300 focus:outline-none"
            >
              {t('nav.trackingDelivery')}
            </Link>

            {/* Login/account, cart and language sit together at the right edge.
                The group is only pinned there from lg up, where the row is wide
                enough to clear the centred links; below that it wraps to its
                own centred line. */}
            <div className="flex w-full items-center justify-center gap-2 lg:absolute lg:right-0 lg:w-auto lg:gap-3">
              {!user && (
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="inline-flex h-8 items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 font-bold text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/15 sm:h-10 sm:px-4 sm:text-base"
                >
                  <span>{t('auth.login')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onCartClick}
                className="relative inline-flex h-8 items-center justify-center rounded-full border border-white/15 bg-white/5 px-2 font-bold text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white sm:h-10 sm:px-5 sm:text-base"
              >
                <span className="text-xl leading-none sm:text-2xl" aria-hidden="true">🛒</span>
                <span className="sr-only">{t('nav.cart')}</span>
                {cartCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>

              {user && (
                <button
                  type="button"
                  onClick={onAccountClick}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 font-bold text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white sm:h-10 sm:px-4 sm:text-base"
                  aria-label={t('nav.account')}
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-300/15 text-[0.65rem] text-cyan-200" aria-hidden="true">👤</span>
                  <span>{t('nav.account')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onLanguageClick}
                className="inline-flex h-8 items-center rounded-full border border-white/15 bg-white/5 px-3 font-bold text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white sm:h-10 sm:px-4 sm:text-base"
                aria-label={t('nav.language')}
              >
                <span className="uppercase">{lang}</span>
              </button>
            </div>
          </nav>
        </div>
      </div>

      <div className="border-b border-white/10 bg-slate-950/40">
        <div className="mx-auto flex max-w-7xl justify-center px-4 py-3 sm:px-6">
          <Link
            to="/shipping-prices"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group flex h-12 w-full max-w-sm items-center justify-center gap-3 overflow-hidden rounded-full border border-cyan-300/30 bg-gradient-to-r from-cyan-400/15 via-white/5 to-emerald-400/15 px-4 text-[0.65rem] font-extrabold uppercase tracking-[0.1em] text-white shadow-[0_8px_25px_rgba(6,182,212,0.1)] transition hover:border-cyan-300/60 hover:bg-white/10 sm:h-14 sm:w-fit sm:max-w-none sm:px-5 sm:text-xs"
            aria-label="Shipping & Delivery — UPS and GAP AKIS Express"
          >
            <span className="whitespace-nowrap">Shipping &amp; Delivery</span>
            <img
              src="/pictures/shipping/ups-akis.png"
              alt="UPS and GAP AKIS Express"
              className="h-9 w-auto shrink-0 object-contain transition group-hover:scale-[1.03] sm:h-11"
            />
          </Link>
        </div>
      </div>
    </>
  )
}
