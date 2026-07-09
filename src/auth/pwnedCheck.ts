/**
 * Free client-side "leaked password" check against HaveIBeenPwned's Pwned
 * Passwords range API, using k-anonymity: the password is SHA-1 hashed locally
 * and only the first 5 hex characters of the hash ever leave the browser, so the
 * secret itself is never transmitted.
 *
 * This mirrors what Supabase's built-in leaked-password protection does, but that
 * feature is gated to Pro plans — this keeps the same guarantee on the Free plan.
 *
 * Fails open (returns false) on any crypto/network error so a HIBP outage can
 * never block a legitimate signup.
 */
export async function isPasswordPwned(password: string): Promise<boolean> {
  try {
    if (!password || !crypto?.subtle) return false

    const digest = await crypto.subtle.digest(
      'SHA-1',
      new TextEncoder().encode(password),
    )
    const hash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()

    const prefix = hash.slice(0, 5)
    const suffix = hash.slice(5)

    // "Add-Padding" makes every response a uniform size, hiding how many matches
    // exist for this prefix from a network observer.
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    })
    if (!res.ok) return false

    const body = await res.text()
    return body.split('\n').some((line) => {
      const [suf, count] = line.split(':')
      return suf.trim().toUpperCase() === suffix && Number(count) > 0
    })
  } catch {
    return false
  }
}
