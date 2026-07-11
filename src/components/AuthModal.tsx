import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'
import { PasswordStrength } from './PasswordStrength'
import { isPasswordPwned } from '../auth/pwnedCheck'
import {
  ADMIN_SECURITY_EXEMPT,
  BUSINESS_MIN_PASSWORD,
  PERSONAL_MIN_PASSWORD,
  minPasswordLength,
} from '../auth/passwordPolicy'
import type { TranslationKey } from '../i18n/translations'

export type AuthMode =
  | 'login'
  | 'signup'
  | 'resetPassword'
  | 'changePassword'
  | 'updatePassword'

type SignupKind = 'personal' | 'business'

interface AuthModalProps {
  open: boolean
  mode: AuthMode
  onClose: () => void
  onModeChange: (mode: AuthMode) => void
}

const emptyBusiness = {
  companyName: '',
  vatNumber: '',
  registrationNumber: '',
  contactName: '',
  phone: '',
  billingEmail: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
}

export function AuthModal({ open, mode, onClose, onModeChange }: AuthModalProps) {
  const { t } = useTranslation()
  const {
    user,
    profile,
    isAdmin,
    signIn,
    signInWithGoogle,
    signUp,
    resetPassword,
    changePassword,
    updatePassword,
  } = useAuth()

  const [signupKind, setSignupKind] = useState<SignupKind>('personal')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [business, setBusiness] = useState(emptyBusiness)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  // Reset the form whenever the modal opens or the mode switches. Deferred to a
  // microtask so the reset doesn't run synchronously inside the effect body.
  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      setSignupKind('personal')
      setUsername('')
      setEmail('')
      setPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setBusiness(emptyBusiness)
      setError('')
      setSuccess('')
      setBusy(false)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [open, mode])

  if (!open) return null

  const isSignup = mode === 'signup'
  const isResetPassword = mode === 'resetPassword'
  const isChangePassword = mode === 'changePassword'
  // "updatePassword" is the final step of a forgot-password flow: the user
  // arrived via the email link and just sets a new password (no old one needed).
  const isUpdatePassword = mode === 'updatePassword'
  const isBusinessSignup = isSignup && signupKind === 'business'

  // Business and admin accounts carry the stronger 12-character minimum; everyone
  // else gets the low-friction 8. For change-password we lean on the logged-in
  // profile (admins and approved businesses stay on the high bar).
  const signupPasswordMin = minPasswordLength(signupKind)
  const adminExempt = isAdmin && ADMIN_SECURITY_EXEMPT
  const changePasswordMin =
    profile?.account_type === 'business' || (isAdmin && !adminExempt)
      ? BUSINESS_MIN_PASSWORD
      : PERSONAL_MIN_PASSWORD
  const hintKey: TranslationKey = isBusinessSignup
    ? 'auth.passwordHintBusiness'
    : 'auth.passwordHint'
  // Google sign-in is offered for the low-friction paths only — plain login and
  // personal signup. Business accounts need the full company form, so no OAuth.
  const showGoogle = mode === 'login' || (isSignup && signupKind === 'personal')

  function updateBusiness(key: keyof typeof emptyBusiness, value: string) {
    setBusiness((prev) => ({ ...prev, [key]: value }))
  }

  async function handleGoogle() {
    setError('')
    setBusy(true)
    try {
      await signInWithGoogle()
      // Browser redirects to Google on success; keep the spinner until then.
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errGeneric'))
      setBusy(false)
    }
  }

  /** Turn a Supabase auth error into friendly, translated copy. */
  function describeError(err: unknown): string {
    if (err && typeof err === 'object') {
      const e = err as { name?: string; message?: string; reasons?: string[] }
      const reasons = Array.isArray(e.reasons) ? e.reasons : []
      if (e.name === 'AuthWeakPasswordError' || reasons.length) {
        if (reasons.includes('pwned')) return t('auth.errPasswordLeaked')
        return t('auth.errPasswordWeak')
      }
      // Supabase surfaces the leaked-password rejection as a plain message too.
      if (typeof e.message === 'string' && /pwned|leaked|data breach/i.test(e.message)) {
        return t('auth.errPasswordLeaked')
      }
      if (typeof e.message === 'string' && e.message) return e.message
    }
    return t('auth.errGeneric')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (mode === 'signup') {
      if (!username.trim() || !email.trim() || !password || !confirmPassword) {
        setError(t('auth.errFields'))
        return
      }
      const signupMin = minPasswordLength(signupKind)
      if (password.length < signupMin) {
        setError(t('auth.errPasswordShort').replace('{n}', String(signupMin)))
        return
      }
      if (password !== confirmPassword) {
        setError(t('auth.errPasswordMatch'))
        return
      }
      if (signupKind === 'business') {
        const required = [
          business.companyName,
          business.vatNumber,
          business.contactName,
          business.phone,
          business.addressLine1,
          business.city,
          business.postalCode,
          business.country,
        ]
        if (required.some((v) => !v.trim())) {
          setError(t('auth.errFields'))
          return
        }
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
      if (newPassword.length < changePasswordMin) {
        setError(t('auth.errPasswordShort').replace('{n}', String(changePasswordMin)))
        return
      }
      if (newPassword !== confirmPassword) {
        setError(t('auth.errPasswordMatch'))
        return
      }
    } else if (mode === 'updatePassword') {
      if (!newPassword || !confirmPassword) {
        setError(t('auth.errFields'))
        return
      }
      if (newPassword.length < changePasswordMin) {
        setError(t('auth.errPasswordShort').replace('{n}', String(changePasswordMin)))
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
      // Block passwords known from data breaches (free client-side HIBP check).
      if (mode === 'signup' && (await isPasswordPwned(password))) {
        setError(t('auth.errPasswordLeaked'))
        return
      }
      if (
        (mode === 'changePassword' || mode === 'updatePassword') &&
        (await isPasswordPwned(newPassword))
      ) {
        setError(t('auth.errPasswordLeaked'))
        return
      }

      if (mode === 'signup') {
        await signUp({
          username: username.trim(),
          email: email.trim(),
          password,
          business:
            signupKind === 'business'
              ? {
                  companyName: business.companyName.trim(),
                  vatNumber: business.vatNumber.trim(),
                  registrationNumber: business.registrationNumber.trim(),
                  contactName: business.contactName.trim(),
                  phone: business.phone.trim(),
                  billingEmail: business.billingEmail.trim(),
                  addressLine1: business.addressLine1.trim(),
                  addressLine2: business.addressLine2.trim(),
                  city: business.city.trim(),
                  state: business.state.trim(),
                  postalCode: business.postalCode.trim(),
                  country: business.country.trim(),
                }
              : undefined,
        })
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
      } else if (mode === 'updatePassword') {
        await updatePassword(newPassword)
        setNewPassword('')
        setConfirmPassword('')
        setSuccess(t('auth.passwordUpdated'))
      } else {
        await signIn({ email: email.trim(), password })
        setSuccess(t('auth.loginSuccess'))
      }
    } catch (err) {
      setError(describeError(err))
    } finally {
      setBusy(false)
    }
  }

  const title = isBusinessSignup
    ? t('auth.businessSignupTitle')
    : isSignup
      ? t('auth.signupTitle')
      : isResetPassword
        ? t('auth.resetPasswordTitle')
        : isChangePassword
          ? t('auth.changePasswordTitle')
          : isUpdatePassword
            ? t('auth.updatePasswordTitle')
            : t('auth.loginTitle')

  const inputClass =
    'w-full rounded-lg border border-white/15 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-400 outline-none transition focus:border-cyan-400'

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
      <div
        className={`relative w-full rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl ${
          isBusinessSignup ? 'max-w-lg' : 'max-w-sm'
        } max-h-[90vh] overflow-y-auto`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('auth.close')}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>

        <h2 className="mb-5 text-xl font-extrabold text-white">{title}</h2>

        {/* Account-type tabs (signup only) */}
        {isSignup && !success && (
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-slate-800/60 p-1">
            <button
              type="button"
              onClick={() => {
                setSignupKind('personal')
                setError('')
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                signupKind === 'personal'
                  ? 'bg-cyan-400 text-slate-900'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {t('auth.personalTab')}
            </button>
            <button
              type="button"
              onClick={() => {
                setSignupKind('business')
                setError('')
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                signupKind === 'business'
                  ? 'bg-cyan-400 text-slate-900'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {t('auth.businessTab')}
            </button>
          </div>
        )}

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
            {isUpdatePassword && (
              <p className="text-sm leading-6 text-slate-400">
                {t('auth.updatePasswordDesc')}
              </p>
            )}

            {/* Account credentials */}
            {isBusinessSignup && (
              <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t('auth.accountDetails')}
              </p>
            )}

            {isSignup && (
              <input
                type="text"
                autoComplete="username"
                placeholder={t('auth.username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
              />
            )}

            {!isUpdatePassword && (!isChangePassword || !user) && (
              <input
                type="email"
                autoComplete="email"
                placeholder={t('auth.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            )}

            {!isResetPassword && !isUpdatePassword && (
              <div>
                <input
                  type="password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  placeholder={
                    isChangePassword ? t('auth.oldPassword') : t('auth.password')
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
                {isSignup && (
                  <>
                    <p className="mt-1 pl-1 text-xs text-slate-400">
                      {t(hintKey).replace('{n}', String(signupPasswordMin))}
                    </p>
                    <PasswordStrength
                      password={password}
                      minLength={signupPasswordMin}
                    />
                  </>
                )}
              </div>
            )}

            {(isChangePassword || isUpdatePassword) && (
              <div>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('auth.newPassword')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                />
                <p className="mt-1 pl-1 text-xs text-slate-400">
                  {t('auth.passwordHint').replace('{n}', String(changePasswordMin))}
                </p>
                <PasswordStrength
                  password={newPassword}
                  minLength={changePasswordMin}
                />
              </div>
            )}

            {(isSignup || isChangePassword || isUpdatePassword) && (
              <input
                type="password"
                autoComplete="new-password"
                placeholder={
                  isChangePassword || isUpdatePassword
                    ? t('auth.confirmNewPassword')
                    : t('auth.confirmPassword')
                }
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
            )}

            {/* Business / invoicing details */}
            {isBusinessSignup && (
              <>
                <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t('auth.companyDetails')}
                </p>
                <input
                  type="text"
                  autoComplete="organization"
                  placeholder={t('auth.companyName')}
                  value={business.companyName}
                  onChange={(e) => updateBusiness('companyName', e.target.value)}
                  className={inputClass}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder={t('auth.vatNumber')}
                    value={business.vatNumber}
                    onChange={(e) => updateBusiness('vatNumber', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder={t('auth.registrationNumber')}
                    value={business.registrationNumber}
                    onChange={(e) =>
                      updateBusiness('registrationNumber', e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder={t('auth.contactName')}
                    value={business.contactName}
                    onChange={(e) =>
                      updateBusiness('contactName', e.target.value)
                    }
                    className={inputClass}
                  />
                  <input
                    type="tel"
                    autoComplete="tel"
                    placeholder={t('auth.phone')}
                    value={business.phone}
                    onChange={(e) => updateBusiness('phone', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <input
                  type="email"
                  placeholder={t('auth.billingEmail')}
                  value={business.billingEmail}
                  onChange={(e) =>
                    updateBusiness('billingEmail', e.target.value)
                  }
                  className={inputClass}
                />

                <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t('auth.billingAddress')}
                </p>
                <input
                  type="text"
                  autoComplete="address-line1"
                  placeholder={t('auth.addressLine1')}
                  value={business.addressLine1}
                  onChange={(e) =>
                    updateBusiness('addressLine1', e.target.value)
                  }
                  className={inputClass}
                />
                <input
                  type="text"
                  autoComplete="address-line2"
                  placeholder={t('auth.addressLine2')}
                  value={business.addressLine2}
                  onChange={(e) =>
                    updateBusiness('addressLine2', e.target.value)
                  }
                  className={inputClass}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    autoComplete="address-level2"
                    placeholder={t('auth.city')}
                    value={business.city}
                    onChange={(e) => updateBusiness('city', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    autoComplete="address-level1"
                    placeholder={t('auth.state')}
                    value={business.state}
                    onChange={(e) => updateBusiness('state', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    autoComplete="postal-code"
                    placeholder={t('auth.postalCode')}
                    value={business.postalCode}
                    onChange={(e) =>
                      updateBusiness('postalCode', e.target.value)
                    }
                    className={inputClass}
                  />
                  <input
                    type="text"
                    autoComplete="country-name"
                    placeholder={t('auth.country')}
                    value={business.country}
                    onChange={(e) => updateBusiness('country', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </>
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
                    : isChangePassword || isUpdatePassword
                      ? t('auth.updatingPassword')
                      : t('auth.signingIn')
                : isBusinessSignup
                  ? t('auth.createBusinessAccount')
                  : isSignup
                    ? t('auth.createAccount')
                    : isResetPassword
                      ? t('auth.resetPassword')
                      : isChangePassword
                        ? t('auth.changePassword')
                        : isUpdatePassword
                          ? t('auth.setNewPassword')
                          : t('auth.login')}
            </button>

            {showGoogle && (
              <>
                <div className="flex items-center gap-3 pt-1">
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {t('auth.or')}
                  </span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/15 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <GoogleIcon />
                  {t('auth.continueGoogle')}
                </button>
              </>
            )}
          </form>
        )}

        {!success && (
          <div className="mt-4 text-center text-sm text-slate-400">
            {isResetPassword || isChangePassword || isUpdatePassword ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if ((isChangePassword && user) || isUpdatePassword) onClose()
                    else onModeChange('login')
                  }}
                  className="font-semibold text-cyan-300 hover:text-cyan-200"
                >
                  {(isChangePassword && user) || isUpdatePassword
                    ? t('auth.close')
                    : t('auth.backToLogin')}
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

/** Google's multi-colour "G" mark, inlined so it needs no external asset. */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  )
}
