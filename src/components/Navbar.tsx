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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/60 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-5">
        <a href="#top" className="flex items-center">
          <img
            src="/pictures/Logo/viber_image_2026-06-20_16-16-33-937.jpg"
            alt="DiscusFish logo"
            className="h-28 w-auto rounded-2xl object-contain shadow-sm ring-1 ring-slate-200 sm:h-36"
          />
        </a>

        {accountName && (
          <div className="hidden min-w-0 text-left sm:block">
            <div className="text-base font-semibold text-slate-400">Welcome</div>
            <div className="max-w-36 truncate text-2xl font-extrabold text-white">
              {accountName}
            </div>
          </div>
        )}

        <nav className="hidden flex-1 items-center justify-center gap-8 text-lg font-semibold text-slate-300 sm:flex">
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

        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onCartClick}
            className="relative inline-flex h-12 items-center gap-2.5 rounded-full bg-cyan-400 px-5 text-base font-bold text-slate-900 transition hover:bg-cyan-300"
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
            className="inline-flex h-12 items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-5 text-base font-bold text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white"
            aria-label={t('nav.language')}
          >
            <span className="uppercase">{lang}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => signOut()}
                className="inline-flex h-12 items-center rounded-full border border-white/15 bg-white/5 px-5 text-base font-bold text-slate-200 transition hover:border-rose-400/40 hover:text-white"
              >
                {t('auth.logout')}
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={onAdminClick}
                  className="hidden h-12 items-center rounded-full border border-cyan-400/40 bg-cyan-400/10 px-5 text-base font-bold text-cyan-200 transition hover:bg-cyan-400/20 sm:inline-flex"
                >
                  {t('auth.adminPanel')}
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => onAuthClick('login')}
                className="inline-flex h-12 items-center rounded-full border border-white/15 bg-white/5 px-5 text-base font-bold text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white"
              >
                {t('auth.login')}
              </button>
              <button
                type="button"
                onClick={() => onAuthClick('signup')}
                className="inline-flex h-12 items-center rounded-full bg-white px-5 text-base font-bold text-slate-900 transition hover:bg-slate-200"
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
