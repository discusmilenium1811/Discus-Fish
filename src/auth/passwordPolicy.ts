import type { AccountType } from '../lib/supabase'

/**
 * Password rules, centralised so the UI, the strength meter and the validation
 * logic all agree.
 *
 * Consumer (personal) accounts favour low friction: a modern 8-character
 * minimum plus a leaked-password check against HaveIBeenPwned. Business and
 * admin accounts trade convenience for security — a 12-character minimum and
 * mandatory TOTP two-factor authentication (enforced by the MFA gate).
 *
 * NB: the HIBP check is the CLIENT-side one in `./pwnedCheck.ts`. Supabase's
 * built-in `password_hibp_enabled` is a paid-plan feature and is off on this
 * project's Free plan (the Management API returns 402), so it is not a second
 * line of defence — a caller hitting the GoTrue API directly bypasses the check.
 * If the project ever moves to Pro, enable it there and this becomes enforced.
 */
export const PERSONAL_MIN_PASSWORD = 8
export const BUSINESS_MIN_PASSWORD = 12

/**
 * Escape hatch for the admin account: when true, the admin is exempt from forced
 * TOTP 2FA and the stronger 12-character minimum. It was set during development
 * so the admin panel could be used without a second factor.
 *
 * Turned OFF on 2026-08-29, at go-live with real payments — the admin account
 * now sees real orders and customer data, so it must carry a second factor. On
 * the next sign-in the admin is taken through TOTP enrolment by `MfaGate`.
 *
 * Only flip this back to `true` to recover from a lock-out, and turn it off
 * again straight after. Business accounts are unaffected either way.
 */
export const ADMIN_SECURITY_EXEMPT = false

/** Minimum password length for the given account type. */
export function minPasswordLength(accountType: AccountType): number {
  return accountType === 'business' ? BUSINESS_MIN_PASSWORD : PERSONAL_MIN_PASSWORD
}

/**
 * Accounts that must protect their sign-in with TOTP two-factor auth: business
 * accounts always, and admins unless temporarily exempted (ADMIN_SECURITY_EXEMPT).
 */
export function requiresMfa(accountType: AccountType | undefined, isAdmin: boolean): boolean {
  if (isAdmin && ADMIN_SECURITY_EXEMPT) return false
  return isAdmin || accountType === 'business'
}
