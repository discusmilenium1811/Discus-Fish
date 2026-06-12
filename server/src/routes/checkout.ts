import { Router } from 'express'
import { z } from 'zod'
import { inArray } from 'drizzle-orm'
import { db } from '../db/index.js'
import { products } from '../db/schema.js'
import { stripe } from '../lib/stripe.js'
import { env } from '../env.js'

export const checkoutRouter = Router()

const checkoutInput = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .min(1),
})

// --- Public: create a Stripe Checkout session (guest checkout) ---
// Prices come from the DB, never the client, so they can't be tampered with.
checkoutRouter.post('/', async (req, res) => {
  const parsed = checkoutInput.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: z.flattenError(parsed.error) })
  }
  const { items } = parsed.data

  const ids = items.map((i) => i.productId)
  const rows = await db
    .select()
    .from(products)
    .where(inArray(products.id, ids))

  const byId = new Map(rows.map((p) => [p.id, p]))

  const lineItems: Array<{
    price_data: {
      currency: string
      unit_amount: number
      product_data: { name: string }
    }
    quantity: number
  }> = []

  for (const item of items) {
    const product = byId.get(item.productId)
    if (!product || !product.isActive) {
      return res
        .status(400)
        .json({ error: `Product unavailable: ${item.productId}` })
    }
    lineItems.push({
      price_data: {
        currency: product.currency,
        unit_amount: product.priceCents,
        product_data: { name: product.name },
      },
      quantity: item.quantity,
    })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: `${env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.CLIENT_URL}/cart`,
    // Compact cart snapshot for the webhook to build the order from.
    metadata: {
      cart: JSON.stringify(
        items.map((i) => ({ id: i.productId, q: i.quantity })),
      ),
    },
  })

  res.json({ id: session.id, url: session.url })
})
