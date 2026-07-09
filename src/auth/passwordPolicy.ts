import type { AccountType } from '../lib/supabase'

/**
 * Password rules, centralised so the UI, the strength meter and the validation
 * logic all agree.
 *
 * Consumer (personal) accounts favour low friction: a modern 8-character
 * minimum plus Supabase's leaked-password check (HaveIBeenPwned). Business and
 * admin accounts trade convenience for security — a 12-character minimum and
 * mandatory TOTP two-factor authentication (enforced by the MFA gate).
 */
export const PERSONAL_MIN_PASSWORD = 8
export const BUSINESS_MIN_PASSWORD = 12

/**
 * TEMPORARY escape hatch: when true, the admin account is exempt from the new
 * security requirements (forced TOTP 2FA and the stronger 12-character minimum)
 * so it can be used without a second factor. Business accounts are unaffected.
 * Set back to `false` to re-enable admin 2FA and the stricter admin password rule.
 */
export const ADMIN_SECURITY_EXEMPT = true

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
