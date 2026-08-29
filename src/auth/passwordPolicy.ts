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
 * Exempts the admin account from forced TOTP 2FA and the stronger 12-character
 * minimum, leaving it on a password alone.
 *
 * This is a deliberate choice by the shop owner (2026-08-29), not an oversight
 * or a leftover development flag — it was briefly enabled at go-live and turned
 * back off at the owner's request. Do not "fix" it without asking them.
 *
 * What it costs: the admin account can read every order and every customer's
 * name, address and phone number, and it is the account an attacker would want.
 * With this flag on, one password is the only thing protecting it.
 *
 * Set to `false` to require TOTP; `MfaGate` then walks the admin through
 * enrolment on the next sign-in. Business accounts are unaffected either way.
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
