import { useEffect, useState } from 'react'
import { useAuth, type MfaEnrollment } from '../auth/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'
import { ADMIN_SECURITY_EXEMPT, requiresMfa } from '../auth/passwordPolicy'

type GateMode = 'checking' | 'ok' | 'enroll' | 'challenge'

/**
 * Full-screen gate that enforces TOTP two-factor auth for the accounts that
 * require it. Business and admin accounts must enrol a factor on first login
 * (they cannot reach the app until they do); anyone with a verified factor must
 * pass the code challenge each session before the session is elevated to aal2.
 * The only escape without completing 2FA is signing out.
 */
export function MfaGate() {
  const { t } = useTranslation()
  const { user, profile, isAdmin, loading, recovery, getMfaStatus, enrollMfa, verifyMfa, signOut } =
    useAuth()

  const [mode, setMode] = useState<GateMode>('checking')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [enrollment, setEnrollment] = useState<MfaEnrollment | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Decide whether the gate must show. The session's assurance level is only
  // known asynchronously, so every setState below runs after an await — logout
  // is handled by the `!user` guard in render, not by a synchronous reset here.
  useEffect(() => {
    // Temporarily exempt the admin account entirely (see render guard too) — no
    // enrollment, no challenge. Also stand down during password recovery so the
    // "set a new password" screen isn't buried under the gate.
    if (loading || !user || recovery || (isAdmin && ADMIN_SECURITY_EXEMPT)) return
    let active = true
    ;(async () => {
      try {
        const status = await getMfaStatus()
        if (!active) return
        if (status.currentLevel === 'aal2') {
          setMode('ok')
        } else if (status.hasVerifiedFactor && status.nextLevel === 'aal2') {
          setFactorId(status.factorId)
          setMode('challenge')
        } else if (requiresMfa(profile?.account_type, isAdmin)) {
          setMode('enroll')
        } else {
          setMode('ok')
        }
      } catch {
        // Never lock a user out of the whole site because a status read failed.
        if (active) setMode('ok')
      }
    })()
    return () => {
      active = false
    }
  }, [loading, user, recovery, profile?.account_type, isAdmin, getMfaStatus])

  // Create the TOTP factor lazily once we know enrolment is required.
  useEffect(() => {
    if (mode !== 'enroll' || enrollment) return
    let active = true
    enrollMfa()
      .then((e) => {
        if (!active) return
        setEnrollment(e)
        setFactorId(e.factorId)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : t('auth.errGeneric'))
      })
    return () => {
      active = false
    }
  }, [mode, enrollment, enrollMfa, t])

  if (
    !user ||
    recovery ||
    (isAdmin && ADMIN_SECURITY_EXEMPT) ||
    mode === 'checking' ||
    mode === 'ok'
  )
    return null

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId || code.length < 6) {
      setError(t('mfa.errCode'))
      return
    }
    setError('')
    setBusy(true)
    try {
      await verifyMfa(factorId, code)
      setCode('')
      setMode('ok')
    } catch {
      setError(t('mfa.errCode'))
    } finally {
      setBusy(false)
    }
  }

  const isEnroll = mode === 'enroll'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300/15 text-lg" aria-hidden="true">
            🔒
          </span>
          <h2 className="text-lg font-extrabold text-white">
            {isEnroll ? t('mfa.setupTitle') : t('mfa.challengeTitle')}
          </h2>
        </div>

        <p className="mb-4 text-sm leading-6 text-slate-400">
          {isEnroll ? t('mfa.setupDesc') : t('mfa.challengeDesc')}
        </p>

        {isEnroll && (
          <div className="mb-4 space-y-3">
            {enrollment ? (
              <>
                <div className="flex justify-center rounded-xl bg-white p-3">
                  {/* Supabase returns the QR as an SVG data URI. */}
                  <img src={enrollment.qrCode} alt={t('mfa.qrAlt')} className="h-40 w-40" />
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t('mfa.secretLabel')}
                  </p>
                  <code className="block break-all rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-center text-xs tracking-widest text-cyan-200">
                    {enrollment.secret}
                  </code>
                </div>
              </>
            ) : (
              <p className="text-center text-sm text-slate-500">{t('mfa.loading')}</p>
            )}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full rounded-lg border border-white/15 bg-slate-800 px-3.5 py-2.5 text-center text-lg tracking-[0.4em] text-white outline-none transition focus:border-cyan-400"
          />

          {error && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy || (isEnroll && !enrollment) || code.length < 6}
            className="w-full rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? t('mfa.verifying') : isEnroll ? t('mfa.activate') : t('mfa.verify')}
          </button>
        </form>

        <button
          type="button"
          onClick={() => signOut()}
          className="mt-4 w-full text-center text-sm font-semibold text-slate-400 transition hover:text-white"
        >
          {t('auth.logout')}
        </button>
      </div>
    </div>
  )
}
