import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'

export type AuthMode = 'login' | 'signup' | 'resetPassword' | 'changePassword'

interface AuthModalProps {
  open: boolean
  mode: AuthMode
  onClose: () => void
  onModeChange: (mode: AuthMode) => void
}

export function AuthModal({ open, mode, onClose, onModeChange }: AuthModalProps) {
  const { t } = useTranslation()
  const { user, signIn, signUp, resetPassword, changePassword } = useAuth()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
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
      setNewPassword('')
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
    } else if (mode === 'resetPassword') {
      if (!email.trim()) {
        setError(t('auth.errFields'))
        return
      }
    } else if (mode === 'changePassword') {
      if (!user && !email.trim()) {
        setError(t('auth.errFields'))
        return
      }
      if (!password || !newPassword || !confirmPassword) {
        setError(t('auth.errFields'))
        return
      }
      if (newPassword.length < 6) {
        setError(t('auth.errPasswordShort'))
        return
      }
      if (newPassword !== confirmPassword) {
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
      } else if (mode === 'resetPassword') {
        await resetPassword({ email: email.trim() })
        setSuccess(t('auth.resetSent'))
      } else if (mode === 'changePassword') {
        await changePassword({
          email: user ? undefined : email.trim(),
          currentPassword: password,
          newPassword,
        })
        setPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setSuccess(t('auth.passwordUpdated'))
      } else {
        await signIn({ email: email.trim(), password })
        setSuccess(t('auth.loginSuccess'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const isSignup = mode === 'signup'
  const isResetPassword = mode === 'resetPassword'
  const isChangePassword = mode === 'changePassword'
  const title = isSignup
    ? t('auth.signupTitle')
    : isResetPassword
      ? t('auth.resetPasswordTitle')
    : isChangePassword
      ? t('auth.changePasswordTitle')
      : t('auth.loginTitle')

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
          {title}
        </h2>

        {success ? (
          <div className="space-y-3">
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {success}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
            >
              {t('auth.done')}
            </button>
          </div>
        ) : (
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

          {(!isChangePassword || !user) && (
            <input
              type="email"
              autoComplete="email"
              placeholder={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-400 outline-none transition focus:border-cyan-400"
            />
          )}

          {!isResetPassword && (
            <div>
            <input
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder={isChangePassword ? t('auth.oldPassword') : t('auth.password')}
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
          )}

          {isChangePassword && (
            <div>
              <input
                type="password"
                autoComplete="new-password"
                placeholder={t('auth.newPassword')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-400 outline-none transition focus:border-cyan-400"
              />
              <p className="mt-1 pl-1 text-xs text-slate-400">
                {t('auth.passwordHint')}
              </p>
            </div>
          )}

          {(isSignup || isChangePassword) && (
            <input
              type="password"
              autoComplete="new-password"
              placeholder={isChangePassword ? t('auth.confirmNewPassword') : t('auth.confirmPassword')}
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
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy
              ? isSignup
                ? t('auth.creating')
                : isResetPassword
                  ? t('auth.sendingReset')
                : isChangePassword
                  ? t('auth.updatingPassword')
                : t('auth.signingIn')
              : isSignup
                ? t('auth.createAccount')
                : isResetPassword
                  ? t('auth.resetPassword')
                : isChangePassword
                  ? t('auth.changePassword')
            : t('auth.login')}
          </button>
        </form>
        )}

        {!success && (
        <div className="mt-4 text-center text-sm text-slate-400">
          {isResetPassword || isChangePassword ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (isChangePassword && user) onClose()
                  else onModeChange('login')
                }}
                className="font-semibold text-cyan-300 hover:text-cyan-200"
              >
                {isChangePassword && user ? t('auth.close') : t('auth.backToLogin')}
              </button>
            </>
          ) : isSignup ? (
            <>
              {t('auth.haveAccount')}{' '}
              <button
                type="button"
                onClick={() => onModeChange('login')}
                className="font-semibold text-cyan-300 hover:text-cyan-200"
              >
                {t('auth.login')}
              </button>
              <span className="mx-2 text-slate-600">|</span>
              <button
                type="button"
                onClick={() => onModeChange('resetPassword')}
                className="font-semibold text-cyan-300 hover:text-cyan-200"
              >
                {t('auth.resetPassword')}
              </button>
              <span className="mx-2 text-slate-600">|</span>
              <button
                type="button"
                onClick={() => onModeChange('changePassword')}
                className="font-semibold text-cyan-300 hover:text-cyan-200"
              >
                {t('auth.changePassword')}
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
              <span className="mx-2 text-slate-600">|</span>
              <button
                type="button"
                onClick={() => onModeChange('resetPassword')}
                className="font-semibold text-cyan-300 hover:text-cyan-200"
              >
                {t('auth.resetPassword')}
              </button>
              <span className="mx-2 text-slate-600">|</span>
              <button
                type="button"
                onClick={() => onModeChange('changePassword')}
                className="font-semibold text-cyan-300 hover:text-cyan-200"
              >
                {t('auth.changePassword')}
              </button>
            </>
          )}
        </div>
        )}
      </div>
    </div>
  )
}
