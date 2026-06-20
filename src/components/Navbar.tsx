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

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/60 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <a href="#top" className="flex items-center gap-2.5">
          <img
            src="/pictures/logo.jpg"
            alt="DiscusFish logo"
            className="h-9 w-9 rounded-xl object-cover shadow-sm ring-1 ring-slate-200"
          />
          <span className="text-lg font-extrabold tracking-tight text-white">
            Discus<span className="text-cyan-400">Fish</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 sm:flex">
          <a href="#products" className="transition hover:text-cyan-300">
            {t('nav.shop')}
          </a>
          <button
            type="button"
            onClick={onCatalogClick}
            className="transition hover:text-cyan-300"
          >
            {t('nav.catalog')}
          </button>
          <a href="#features" className="transition hover:text-cyan-300">
            {t('nav.whyUs')}
          </a>
          <a href="#footer" className="transition hover:text-cyan-300">
            {t('nav.contact')}
          </a>
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onLanguageClick}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white"
            aria-label={t('nav.language')}
          >
            <span aria-hidden="true">🌐</span>
            <span className="uppercase">{lang}</span>
          </button>

          <button
            type="button"
            onClick={onCartClick}
            className="relative inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
          >
            <span aria-hidden="true">🛒</span>
            <span className="hidden sm:inline">{t('nav.cart')}</span>
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* Auth controls (top-right corner) */}
          {user ? (
            <div className="flex items-center gap-2.5">
              {isAdmin && (
                <button
                  type="button"
                  onClick={onAdminClick}
                  className="hidden rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3.5 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20 sm:inline-flex"
                >
                  {t('auth.adminPanel')}
                </button>
              )}
              <span className="hidden text-sm font-medium text-slate-300 sm:inline">
                {profile?.username ?? user.email}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-semibold text-slate-200 transition hover:border-rose-400/40 hover:text-white"
              >
                {t('auth.logout')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onAuthClick('login')}
                className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white"
              >
                {t('auth.login')}
              </button>
              <button
                type="button"
                onClick={() => onAuthClick('signup')}
                className="inline-flex items-center rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                {t('auth.signup')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
