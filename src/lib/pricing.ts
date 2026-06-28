// Single source of truth for cart pricing. The Stripe checkout Edge Function
// mirrors these exact rules server-side so the amount charged always matches
// the breakdown shown here (never trust the client for money).

/** Free shipping kicks in at this subtotal (before discount). */
export const FREE_SHIPPING_CENTS = 7500 // €75.00
/** Flat delivery fee below the free-shipping threshold. */
export const SHIPPING_FEE_CENTS = 990 // €9.90
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

/** Delivery fee for a given goods subtotal (free over the threshold). */
export function computeShippingCents(subtotalCents: number): number {
  return subtotalCents >= FREE_SHIPPING_CENTS ? 0 : SHIPPING_FEE_CENTS
}

/**
 * Build the full price breakdown. `discountCents` comes from the server-side
 * coupon validation; pass 0 when no coupon is applied.
 */
export function computeBreakdown(
  subtotalCents: number,
  discountCents = 0,
): PriceBreakdown {
  const safeDiscount = Math.max(0, Math.min(discountCents, subtotalCents))
  const shippingCents = computeShippingCents(subtotalCents)
  const totalCents = Math.max(0, subtotalCents - safeDiscount + shippingCents)
  // Prices include VAT, so the VAT is the fraction already baked into the total.
  const vatCents = Math.round(totalCents - totalCents / (1 + VAT_RATE))
  return {
    subtotalCents,
    discountCents: safeDiscount,
    shippingCents,
    vatCents,
    totalCents,
  }
}
