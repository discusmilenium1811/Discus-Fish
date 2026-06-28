import type { Product } from '../types'
import { supabase } from './supabase'

const CHECKOUT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/checkout`
// Product imagery lives in the public Supabase Storage `product-images` bucket.
const STORAGE = 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images'
const NATURAL_HUMIN_IMAGE = `${STORAGE}/products/natural-humin.png?v=natural-humin-bmp`
const COMING_SOON_IMAGE = `${STORAGE}/New%20products%20Coming%20Soon/yearbook-2026-cover.png`
const PRODUCT_IMAGE_OVERRIDES: Record<string, string> = {
  'additive-1-probiotics': `${STORAGE}/products/Probio/additive-1-probiotics.png`,
  'additive-d7-pro-breeding': `${STORAGE}/products/Probio/additive-d7-pro-breeding.png`,
  'best-heart-flakes-blue-dream': `${STORAGE}/products/card/best-heart-flakes-blue-dream.png`,
  'best-heart-flakes-pro-breed': `${STORAGE}/products/card/best-heart-flakes-pro-breed.png`,
  'golden-color-booster': `${STORAGE}/products/Probio/golden-color-booster.png`,
  'blue-color-booster': `${STORAGE}/products/Probio/blue-color-booster.png`,
  'red-color-booster': `${STORAGE}/products/Probio/red-color-booster.png`,
}

function productImageUrl(
  slug: string,
  name: string,
  isComingSoon: boolean,
  imageUrl?: string | null,
) {
  const normalizedSlug = slug.toLowerCase()

  if (isComingSoon) {
    return COMING_SOON_IMAGE
  }

  if (PRODUCT_IMAGE_OVERRIDES[normalizedSlug]) {
    return PRODUCT_IMAGE_OVERRIDES[normalizedSlug]
  }

  if (
    normalizedSlug === 'natural-humin' ||
    name.toLowerCase() === 'natural humin'
  ) {
    return NATURAL_HUMIN_IMAGE
  }

  return imageUrl
}

/** Fetch the active product catalog from Supabase (public, RLS-protected). */
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, slug, name, description, details, price_cents, currency, image_url, weight_grams, stock, is_active, is_coming_soon, created_at',
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Map Postgres snake_case columns to the front-end Product shape.
  return (data ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    details: p.details,
    priceCents: p.price_cents,
    currency: p.currency,
    imageUrl: productImageUrl(p.slug, p.name, p.is_coming_soon, p.image_url),
    weightGrams: p.weight_grams,
    stock: p.stock,
    isActive: p.is_active,
    isComingSoon: p.is_coming_soon,
  }))
}

export interface CheckoutItem {
  productId: string
  quantity: number
}

export interface CheckoutBilling {
  company: string
  vatNumber: string
  registrationNumber?: string
  contactName?: string
  phone?: string
  email?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

/** Who the order is for and how to reach them. */
export interface CheckoutContact {
  fullName: string
  email?: string
  phone?: string
}

/** Detailed delivery address collected before payment. */
export interface CheckoutShipping {
  country: string
  state?: string
  city: string
  street: string
  building?: string
  floor?: string
  apartment?: string
  postalCode: string
}

export interface CheckoutCustomer {
  userId?: string
  email?: string
  billing?: CheckoutBilling
  contact?: CheckoutContact
  shipping?: CheckoutShipping
  couponCode?: string
}

/** Create a Stripe Checkout session and return its redirect URL. */
export async function createCheckout(
  items: CheckoutItem[],
  customer?: CheckoutCustomer,
): Promise<{ id: string; url: string }> {
  const res = await fetch(CHECKOUT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, ...customer }),
  })
  if (!res.ok) throw new Error(`Checkout failed (${res.status})`)
  return res.json()
}

export interface CouponResult {
  valid: boolean
  /** Discount in cents for the given subtotal (0 when invalid). */
  discountCents: number
  /** Normalised coupon code echoed back when valid. */
  code?: string
  /** Human-readable reason shown when the coupon can't be applied. */
  message?: string
}

export interface PublicReview {
  id: string
  authorName: string
  rating: number
  comment: string
  createdAt: string
}

/** Load only admin-approved general reviews for the Contact page. */
export async function fetchApprovedContactReviews(): Promise<PublicReview[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, author_name, rating, comment, created_at')
    .is('product_id', null)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((review) => ({
    id: review.id,
    authorName: review.author_name ?? 'Anonymous',
    rating: review.rating,
    comment: review.comment,
    createdAt: review.created_at,
  }))
}

/** Submit a general review to the admin moderation queue. */
export async function submitContactReview(input: {
  userId: string
  authorName: string
  rating: number
  comment: string
}): Promise<void> {
  const { error } = await supabase.from('reviews').insert({
    product_id: null,
    user_id: input.userId,
    author_name: input.authorName.trim(),
    rating: input.rating,
    comment: input.comment.trim(),
    status: 'pending',
  })

  if (error) throw error
}

/**
 * Validate a coupon against the live `coupons` table and return the discount it
 * would apply to the given subtotal. Runs server-side (service role) so it works
 * regardless of table RLS and never exposes the full coupon list to the browser.
 */
export async function validateCoupon(
  code: string,
  subtotalCents: number,
): Promise<CouponResult> {
  const res = await fetch(CHECKOUT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'validate-coupon', code, subtotalCents }),
  })
  if (!res.ok) return { valid: false, discountCents: 0, message: 'Could not check coupon.' }
  return res.json()
}
