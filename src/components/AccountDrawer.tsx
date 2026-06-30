import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'
import type { AuthMode } from './AuthModal'

interface AccountDrawerProps {
  open: boolean
  onClose: () => void
  onAuthClick: (mode: AuthMode) => void
  onAdminClick: () => void
}

export function AccountDrawer({ open, onClose, onAuthClick, onAdminClick }: AccountDrawerProps) {
  const { t } = useTranslation()
  const { user, profile, isAdmin } = useAuth()
  const name = profile?.username ?? user?.email ?? t('account.guest')

  const authAction = (mode: AuthMode) => {
    onClose()
    onAuthClick(mode)
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden="true"
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-slate-900 text-slate-100 shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-label={t('account.title')}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cyan-300">DiscusFish</p>
            <h2 className="mt-0.5 text-lg font-extrabold text-white">{t('account.title')}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label={t('account.close')}>✕</button>
        </div>

        <div className="p-5">
          <div className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/10 via-white/5 to-violet-400/10 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-300 text-lg font-black text-slate-950" aria-hidden="true">{user ? name.slice(0, 1).toUpperCase() : '👤'}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400">{user ? t('account.signedIn') : t('account.welcome')}</p>
                <p className="mt-0.5 truncate font-extrabold text-white">{name}</p>
                {isAdmin && <span className="mt-1 inline-flex rounded-full bg-violet-400/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-violet-200">Administrator</span>}
              </div>
            </div>
          </div>

          <nav className="mt-5 space-y-2" aria-label={t('account.title')}>
            {!user ? (
              <DrawerButton icon="＋" label={t('auth.signup')} onClick={() => authAction('signup')} />
            ) : (
              <>
                <DrawerButton icon="🔑" label={t('auth.changePassword')} onClick={() => authAction('changePassword')} />
                {isAdmin && <DrawerButton icon="⚙" label={t('auth.adminPanel')} onClick={() => { onClose(); onAdminClick() }} accent />}
              </>
            )}

            <Link to="/shipping-prices" onClick={onClose} className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-cyan-300/35 hover:bg-white/10">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300/10 text-base" aria-hidden="true">🚚</span>
              <span className="flex-1 text-sm font-bold text-white">{t('nav.shippingPrices')}</span>
              <span className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-300">›</span>
            </Link>
          </nav>
        </div>

        <div className="mt-auto border-t border-white/10 px-5 py-4 text-xs leading-5 text-slate-500">{t('account.footer')}</div>
      </aside>
    </>
  )
}

function DrawerButton({ icon, label, onClick, accent, danger }: { icon: string; label: string; onClick: () => void; accent?: boolean; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={`group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${danger ? 'border-rose-400/15 bg-rose-400/5 hover:border-rose-300/35 hover:bg-rose-400/10' : accent ? 'border-violet-300/20 bg-violet-300/5 hover:border-violet-300/40 hover:bg-violet-300/10' : 'border-white/10 bg-white/5 hover:border-cyan-300/35 hover:bg-white/10'}`}>
    <span className={`grid h-9 w-9 place-items-center rounded-lg text-base ${danger ? 'bg-rose-300/10 text-rose-200' : accent ? 'bg-violet-300/10 text-violet-200' : 'bg-cyan-300/10 text-cyan-200'}`} aria-hidden="true">{icon}</span>
    <span className={`flex-1 text-sm font-bold ${danger ? 'text-rose-200' : 'text-white'}`}>{label}</span>
    <span className="text-slate-500 transition group-hover:translate-x-0.5">›</span>
  </button>
}
