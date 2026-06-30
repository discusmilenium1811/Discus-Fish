import type { Product } from '../types'
import { supabase } from './supabase'

const CHECKOUT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/checkout`
// Product imagery lives in the public Supabase Storage `product-images` bucket.
const STORAGE = 'https://vumjslsogdnexehutibj.supabase.co/storage/v1/object/public/product-images'
const COMING_SOON_IMAGE = `${STORAGE}/New%20products%20Coming%20Soon/yearbook-2026-cover.png`
const PRODUCT_IMAGE_OVERRIDES: Record<string, string> = {
  'additive-1-probiotics': `${STORAGE}/products/Probio/additive-1-probiotics.png`,
  'additive-d7-pro-breeding': `${STORAGE}/products/Probio/additive-d7-pro-breeding.png`,
  'golden-color-booster': `${STORAGE}/products/Probio/golden-color-booster.png`,
  'blue-color-booster': `${STORAGE}/products/Probio/blue-color-booster.png`,
  'red-color-booster': `${STORAGE}/products/Probio/red-color-booster.png`,
}

function productImageUrl(
  slug: string,
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

  return imageUrl
}

/** Fetch the active product catalog from Supabase (public, RLS-protected). */
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, slug, name, description, details, price_cents, currency, image_url, weight_grams, stock, is_active, is_coming_soon, created_at, categories(name, slug)',
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Map Postgres snake_case columns to the front-end Product shape.
  return (data ?? []).map((p) => {
    const category = (Array.isArray(p.categories) ? p.categories[0] : p.categories) as
      | { name: string; slug: string }
      | null
      | undefined
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      details: p.details,
      priceCents: p.price_cents,
      currency: p.currency,
      imageUrl: productImageUrl(p.slug, p.is_coming_soon, p.image_url),
      weightGrams: p.weight_grams,
      stock: p.stock,
      isActive: p.is_active,
      isComingSoon: p.is_coming_soon,
      categoryName: category?.name ?? null,
      categorySlug: category?.slug ?? null,
    }
  })
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
  /** Admin shipping_methods.id the customer picked; server re-validates it. */
  shippingMethodId?: string
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

const CONTACT_REVIEW_PREFIX = '[[contact-review]]'

/** Load only admin-approved general reviews for the Contact page. */
export async function fetchApprovedContactReviews(): Promise<PublicReview[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, author_name, rating, comment, created_at')
    .eq('status', 'approved')
    .like('comment', `${CONTACT_REVIEW_PREFIX}%`)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((review) => ({
    id: review.id,
    authorName: review.author_name ?? 'Anonymous',
    rating: review.rating,
    comment: review.comment.slice(CONTACT_REVIEW_PREFIX.length),
    createdAt: review.created_at,
  }))
}

export interface MyContactReview extends PublicReview {
  /** Moderation state — only the author and admins can see non-approved rows. */
  status: 'pending' | 'approved' | 'rejected'
}

/**
 * Load the signed-in user's OWN Contact-page reviews, any status. RLS
 * (reviews_owner_read) restricts this to the caller's own rows, so a pending
 * review is visible to its author here while staying hidden from the public.
 */
export async function fetchMyContactReviews(userId: string): Promise<MyContactReview[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, author_name, rating, comment, status, created_at')
    .eq('user_id', userId)
    .like('comment', `${CONTACT_REVIEW_PREFIX}%`)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((review) => ({
    id: review.id,
    authorName: review.author_name ?? 'Anonymous',
    rating: review.rating,
    comment: review.comment.slice(CONTACT_REVIEW_PREFIX.length),
    status: review.status,
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
  // The existing production schema requires every review to reference a
  // product. Contact-page reviews use the first active product internally and
  // carry a private prefix so they can still be separated from product reviews.
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (productError) throw productError
  if (!product) throw new Error('No active product is available for this review.')

  const { error } = await supabase.from('reviews').insert({
    product_id: product.id,
    user_id: input.userId,
    author_name: input.authorName.trim(),
    rating: input.rating,
    comment: `${CONTACT_REVIEW_PREFIX}${input.comment.trim()}`,
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
