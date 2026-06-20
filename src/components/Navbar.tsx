import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { useAuth } from '../auth/AuthContext'

interface NavbarProps {
  cartCount: number
  onCartClick: () => void
  onLanguageClick: () => void
  onCatalogClick: () => void
  onAuthClick: (mode: 'login' | 'signup') => void
  onAdminClick: () => void
}

export function Navbar({
  cartCount,
  onCartClick,
  onLanguageClick,
  onCatalogClick,
  onAuthClick,
  onAdminClick,
}: NavbarProps) {
  const { t, lang } = useTranslation()
  const { user, profile, isAdmin, signOut } = useAuth()
  const accountName = profile?.username ?? user?.email

  return (
    <>
      <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-5 sm:gap-8 sm:px-6">
          <Link
            to="/"
            className="flex items-center"
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
              <div className="text-sm font-semibold text-slate-400 sm:text-base">Welcome</div>
              <div className="max-w-32 truncate text-xl font-extrabold text-white sm:max-w-36 sm:text-2xl">
                {accountName}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:px-6 sm:py-4">
          <nav className="grid grid-cols-4 items-center gap-2 text-center text-sm font-semibold text-slate-300 sm:flex sm:flex-1 sm:justify-center sm:gap-8 sm:text-lg">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="transition hover:text-cyan-300 focus:outline-none"
            >
              Home
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
            <a href="#footer" className="transition hover:text-cyan-300">
              {t('nav.contact')}
            </a>
          </nav>

        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:flex-nowrap sm:justify-end sm:gap-3.5">
          <button
            type="button"
            onClick={onCartClick}
            className="relative inline-flex h-11 items-center gap-2.5 rounded-full bg-cyan-400 px-4 text-sm font-bold text-slate-900 transition hover:bg-cyan-300 sm:h-12 sm:px-5 sm:text-base"
          >
            <span>{t('nav.cart')}</span>
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onLanguageClick}
            className="inline-flex h-11 items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-bold text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white sm:h-12 sm:px-5 sm:text-base"
            aria-label={t('nav.language')}
          >
            <span className="uppercase">{lang}</span>
          </button>

          {user ? (
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:flex-nowrap sm:gap-3.5">
              <button
                type="button"
                onClick={() => signOut()}
                className="inline-flex h-11 items-center rounded-full border border-white/15 bg-white/5 px-4 text-sm font-bold text-slate-200 transition hover:border-rose-400/40 hover:text-white sm:h-12 sm:px-5 sm:text-base"
              >
                {t('auth.logout')}
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={onAdminClick}
                  className="inline-flex h-11 items-center rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/20 sm:h-12 sm:px-5 sm:text-base"
                >
                  {t('auth.adminPanel')}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:flex-nowrap sm:gap-4">
              <button
                type="button"
                onClick={() => onAuthClick('login')}
                className="inline-flex h-11 items-center rounded-full border border-white/15 bg-white/5 px-4 text-sm font-bold text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white sm:h-12 sm:px-5 sm:text-base"
              >
                {t('auth.login')}
              </button>
              <button
                type="button"
                onClick={() => onAuthClick('signup')}
                className="inline-flex h-11 items-center rounded-full bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-200 sm:h-12 sm:px-5 sm:text-base"
              >
                {t('auth.signup')}
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  )
}
