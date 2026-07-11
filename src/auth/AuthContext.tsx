import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import {
  supabase,
  type BusinessDetails,
  type Profile,
} from '../lib/supabase'

/** TOTP enrollment payload returned by Supabase when a new factor is created. */
export interface MfaEnrollment {
  factorId: string
  qrCode: string
  secret: string
  uri: string
}

/** Snapshot of the current session's MFA state, used by the MFA gate. */
export interface MfaStatus {
  currentLevel: string | null
  nextLevel: string | null
  hasVerifiedFactor: boolean
  /** Id of the verified TOTP factor to challenge at login, if any. */
  factorId: string | null
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  /** True only for an approved business account — the wholesale pricing gate. */
  isBusinessApproved: boolean
  /**
   * True while the user is in a password-recovery session — i.e. they arrived
   * via the "reset password" email link. The UI uses this to force the
   * "set a new password" screen (and suppress the MFA gate) until it's done.
   */
  recovery: boolean
  /** Clear the recovery flag once the new password has been set (or dismissed). */
  clearRecovery: () => void
  signUp: (args: {
    username: string
    email: string
    password: string
    business?: BusinessDetails
  }) => Promise<void>
  signIn: (args: { email: string; password: string }) => Promise<void>
  signInWithGoogle: () => Promise<void>
  resetPassword: (args: { email: string }) => Promise<void>
  changePassword: (args: {
    email?: string
    currentPassword: string
    newPassword: string
  }) => Promise<void>
  /**
   * Set a new password using the current (recovery or logged-in) session, with
   * no need to know the old one. Used to complete the reset-password flow.
   */
  updatePassword: (newPassword: string) => Promise<void>
  signOut: () => Promise<void>
  /** Start TOTP enrollment; returns the QR/secret to show the user. */
  enrollMfa: () => Promise<MfaEnrollment>
  /** Verify a 6-digit code — completes enrollment or satisfies a login challenge. */
  verifyMfa: (factorId: string, code: string) => Promise<void>
  /** Read the current assurance level and whether a verified factor exists. */
  getMfaStatus: () => Promise<MfaStatus>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const VERIFY_BUSINESS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-business`
// Only attempt VIES verification once per user per app load to avoid re-hitting
// the service on every auth-state change while an account is still pending.
const verifyAttempted = new Set<string>()

/** Ask the edge function to VIES-verify the caller's VAT. Returns the resulting
 *  status ('approved' when auto-verified), or null on any failure. */
async function verifyBusiness(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(VERIFY_BUSINESS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) return null
    const body = await res.json().catch(() => null)
    return body?.status ?? null
  } catch {
    return null
  }
}

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, username, email, role, account_type, business_status, company_name, vat_number, registration_number, contact_name, phone, billing_email, address_line1, address_line2, city, state, postal_code, country',
    )
    .eq('id', userId)
    .single()
  if (error) return null
  return data as Profile
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [recovery, setRecovery] = useState(false)

  const applySession = useCallback(async (session: Session | null) => {
    const nextUser = session?.user ?? null
    setUser(nextUser)

    let nextProfile = nextUser ? await loadProfile(nextUser.id) : null

    // A pending business account gets auto-verified against VIES. If the VAT
    // checks out the edge function flips it to 'approved'; we then reload the
    // profile so wholesale prices unlock immediately. Otherwise it stays pending
    // for the owner to approve manually.
    if (
      nextUser &&
      session &&
      nextProfile?.account_type === 'business' &&
      nextProfile.business_status === 'pending' &&
      !verifyAttempted.has(nextUser.id)
    ) {
      verifyAttempted.add(nextUser.id)
      const status = await verifyBusiness(session.access_token)
      if (status === 'approved') {
        nextProfile = await loadProfile(nextUser.id)
      }
    }

    setProfile(nextProfile)
    setLoading(false)
  }, [])

  useEffect(() => {
    // Pick up an existing session on first load.
    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session)
    })

    // React to sign-in / sign-out across tabs. A PASSWORD_RECOVERY event means
    // the user followed the reset-password email link: supabase-js has just
    // established a short-lived recovery session from the URL. Flag it so the UI
    // can force the "set a new password" screen.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      applySession(session)
    })

    return () => sub.subscription.unsubscribe()
  }, [applySession])

  async function signUp({
    username,
    email,
    password,
    business,
  }: {
    username: string
    email: string
    password: string
    business?: BusinessDetails
  }) {
    const data: Record<string, string> = {
      username,
      account_type: business ? 'business' : 'personal',
    }

    if (business) {
      data.company_name = business.companyName
      data.vat_number = business.vatNumber
      data.contact_name = business.contactName
      data.phone = business.phone
      data.address_line1 = business.addressLine1
      data.city = business.city
      data.postal_code = business.postalCode
      data.country = business.country
      if (business.registrationNumber)
        data.registration_number = business.registrationNumber
      if (business.billingEmail) data.billing_email = business.billingEmail
      if (business.addressLine2) data.address_line2 = business.addressLine2
      if (business.state) data.state = business.state
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data },
    })
    if (error) throw error
  }

  async function signIn({
    email,
    password,
  }: {
    email: string
    password: string
  }) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // Hard-reload to the home page so the whole app re-initialises with the new
    // session and no stale in-memory state (cart, catalog prices, etc.) survives.
    // If the account has TOTP enabled the session lands at aal1 and the MFA gate
    // will demand the second factor after this reload.
    window.location.assign('/')
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
    // On success the browser is redirected to Google; nothing runs after this.
  }

  async function resetPassword({ email }: { email: string }) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) throw error
  }

  async function changePassword({
    email: accountEmail,
    currentPassword,
    newPassword,
  }: {
    email?: string
    currentPassword: string
    newPassword: string
  }) {
    const email = accountEmail?.trim() || user?.email
    if (!email) throw new Error('You must be logged in to change your password.')

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    })
    if (signInError) throw signInError

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  async function updatePassword(newPassword: string) {
    // Works against whatever session is active — the recovery session created by
    // the reset-password email link, or a normal logged-in one. No old password
    // required, which is exactly what a "forgot password" flow needs.
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  async function enrollMfa(): Promise<MfaEnrollment> {
    // Clear any leftover unverified factor from an abandoned attempt so a retry
    // doesn't fail with "a factor with this name already exists".
    const { data: list } = await supabase.auth.mfa.listFactors()
    const stale = (list?.all ?? []).filter((f) => f.status === 'unverified')
    for (const factor of stale) {
      await supabase.auth.mfa.unenroll({ factorId: factor.id })
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `DiscusFish ${new Date().toISOString().slice(0, 10)}`,
    })
    if (error) throw error
    return {
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    }
  }

  async function verifyMfa(factorId: string, code: string) {
    // challengeAndVerify both finalises enrollment and satisfies a login
    // challenge, elevating the session to aal2 on success.
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    })
    if (error) throw error
  }

  async function getMfaStatus(): Promise<MfaStatus> {
    const [{ data: aal }, { data: factors }] = await Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ])
    const verified = (factors?.all ?? []).find(
      (f) => f.status === 'verified' && f.factor_type === 'totp',
    )
    return {
      currentLevel: aal?.currentLevel ?? null,
      nextLevel: aal?.nextLevel ?? null,
      hasVerifiedFactor: Boolean(verified),
      factorId: verified?.id ?? null,
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    // Hard-reload to the home page so nothing from the signed-in session lingers.
    window.location.assign('/')
  }

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isBusinessApproved:
      profile?.account_type === 'business' && profile?.business_status === 'approved',
    recovery,
    clearRecovery: () => setRecovery(false),
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword,
    changePassword,
    updatePassword,
    signOut,
    enrollMfa,
    verifyMfa,
    getMfaStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
