import type { Product } from '../types'
import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const NATURAL_HUMIN_IMAGE = '/pictures/products/natural-humin.png?v=natural-humin-bmp'
const PRODUCT_IMAGE_OVERRIDES: Record<string, string> = {
  'additive-1-probiotics': '/pictures/products/Probio/additive-1-probiotics.png',
  'additive-d7-pro-breeding': '/pictures/products/Probio/additive-d7-pro-breeding.png',
  'best-heart-flakes-blue-dream': '/pictures/products/card/best-heart-flakes-blue-dream.png',
  'best-heart-flakes-pro-breed': '/pictures/products/card/best-heart-flakes-pro-breed.png',
  'golden-color-booster': '/pictures/products/Probio/golden-color-booster.png',
  'blue-color-booster': '/pictures/products/Probio/blue-color-booster.png',
  'red-color-booster': '/pictures/products/Probio/red-color-booster.png',
}

function productImageUrl(slug: string, name: string, imageUrl?: string | null) {
  const normalizedSlug = slug.toLowerCase()

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
    imageUrl: productImageUrl(p.slug, p.name, p.image_url),
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

/** Create a Stripe Checkout session and return its redirect URL. */
export async function createCheckout(
  items: CheckoutItem[],
): Promise<{ id: string; url: string }> {
  const res = await fetch(`${API_URL}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  })
  if (!res.ok) throw new Error(`Checkout failed (${res.status})`)
  return res.json()
}
