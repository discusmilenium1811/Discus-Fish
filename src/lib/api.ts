import type { Product } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/** Fetch the active product catalog from the Express back-end. */
export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/api/products`)
  if (!res.ok) throw new Error(`Failed to load products (${res.status})`)
  return res.json()
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
