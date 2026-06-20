import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'

type Mode = 'login' | 'signup'

interface AuthModalProps {
  open: boolean
  mode: Mode
  onClose: () => void
  onModeChange: (mode: Mode) => void
}

export function AuthModal({ open, mode, onClose, onModeChange }: AuthModalProps) {
  const { t } = useTranslation()
  const { signIn, signUp } = useAuth()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  // Reset the form whenever the modal opens or the mode switches.
  useEffect(() => {
    if (open) {
      setUsername('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setError('')
      setSuccess('')
      setBusy(false)
    }
  }, [open, mode])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (mode === 'signup') {
      if (!username.trim() || !email.trim() || !password || !confirmPassword) {
        setError(t('auth.errFields'))
        return
      }
      if (password.length < 6) {
        setError(t('auth.errPasswordShort'))
        return
      }
      if (password !== confirmPassword) {
        setError(t('auth.errPasswordMatch'))
        return
      }
    } else if (!email.trim() || !password) {
      setError(t('auth.errFields'))
      return
    }

    setBusy(true)
    try {
      if (mode === 'signup') {
        await signUp({ username: username.trim(), email: email.trim(), password })
        setSuccess(t('auth.signupSuccess'))
        onModeChange('login')
      } else {
        await signIn({ email: email.trim(), password })
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const isSignup = mode === 'signup'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label={t('auth.close')}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      {/* Card */}
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('auth.close')}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>

        <h2 className="mb-5 text-xl font-extrabold text-white">
          {isSignup ? t('auth.signupTitle') : t('auth.loginTitle')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignup && (
            <input
              type="text"
              autoComplete="username"
              placeholder={t('auth.username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-400 outline-none transition focus:border-cyan-400"
            />
          )}

          <input
            type="email"
            autoComplete="email"
            placeholder={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-400 outline-none transition focus:border-cyan-400"
          />

          <div>
            <input
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-400 outline-none transition focus:border-cyan-400"
            />
            {isSignup && (
              <p className="mt-1 pl-1 text-xs text-slate-400">
                {t('auth.passwordHint')}
              </p>
            )}
          </div>

          {isSignup && (
            <input
              type="password"
              autoComplete="new-password"
              placeholder={t('auth.confirmPassword')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-400 outline-none transition focus:border-cyan-400"
            />
          )}

          {error && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy
              ? isSignup
                ? t('auth.creating')
                : t('auth.signingIn')
              : isSignup
                ? t('auth.createAccount')
                : t('auth.login')}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-400">
          {isSignup ? (
            <>
              {t('auth.haveAccount')}{' '}
              <button
                type="button"
                onClick={() => onModeChange('login')}
                className="font-semibold text-cyan-300 hover:text-cyan-200"
              >
                {t('auth.login')}
              </button>
            </>
          ) : (
            <>
              {t('auth.noAccount')}{' '}
              <button
                type="button"
                onClick={() => onModeChange('signup')}
                className="font-semibold text-cyan-300 hover:text-cyan-200"
              >
                {t('auth.signup')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
