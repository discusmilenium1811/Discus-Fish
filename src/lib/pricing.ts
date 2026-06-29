// Single source of truth for cart pricing. The Stripe checkout Edge Function
// mirrors these exact rules server-side so the amount charged always matches
// the breakdown shown here (never trust the client for money).
//
// Delivery is NOT hard-coded here: it comes from the admin-managed shipping
// zones/methods (see src/lib/shipping.ts) and is passed in as `shippingCents`.

/** VAT rate. Catalog prices are VAT-inclusive, so this is used to show the
 *  portion of the total that is VAT — it is never added on top. */
export const VAT_RATE = 0.19

export interface PriceBreakdown {
  /** Sum of line items (VAT-inclusive). */
  subtotalCents: number
  /** Coupon discount applied to the goods (already validated server-side). */
  discountCents: number
  /** Delivery charge (0 when free shipping is unlocked). */
  shippingCents: number
  /** VAT portion contained within the total (informational, not additive). */
  vatCents: number
  /** What the customer actually pays. */
  totalCents: number
}

/**
 * Build the full price breakdown. `discountCents` comes from the server-side
 * coupon validation; `shippingCents` is the resolved delivery cost for the
 * customer's chosen country + method. Pass 0 for either when not applicable.
 */
export function computeBreakdown(
  subtotalCents: number,
  discountCents = 0,
  shippingCents = 0,
): PriceBreakdown {
  const safeDiscount = Math.max(0, Math.min(discountCents, subtotalCents))
  const safeShipping = Math.max(0, shippingCents)
  const totalCents = Math.max(0, subtotalCents - safeDiscount + safeShipping)
  // Prices include VAT, so the VAT is the fraction already baked into the total.
  const vatCents = Math.round(totalCents - totalCents / (1 + VAT_RATE))
  return {
    subtotalCents,
    discountCents: safeDiscount,
    shippingCents: safeShipping,
    vatCents,
    totalCents,
  }
}
