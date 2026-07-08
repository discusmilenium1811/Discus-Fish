export function formatPrice(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

/** Human-friendly weight: grams under 1 kg, kilograms above (max 2 decimals). */
export function formatWeight(grams: number): string {
  if (!Number.isFinite(grams) || grams <= 0) return '0 g'
  return grams >= 1000
    ? `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(grams / 1000)} kg`
    : `${Math.round(grams)} g`
}
