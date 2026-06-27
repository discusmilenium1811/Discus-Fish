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

export interface CheckoutCustomer {
  userId?: string
  email?: string
  billing?: CheckoutBilling
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
