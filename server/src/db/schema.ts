import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core'

/**
 * Products = the fish foods for sale.
 * Prices are stored in the smallest currency unit (cents) to avoid float math.
 * The primary image + an array of extra image URLs point at Supabase Storage.
 */
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  details: text('details'), // long-form markdown, optional
  priceCents: integer('price_cents').notNull(),
  currency: text('currency').notNull().default('usd'),
  imageUrl: text('image_url'), // primary image (Supabase Storage public URL)
  images: jsonb('images').$type<string[]>().notNull().default([]),
  weightGrams: integer('weight_grams'),
  stock: integer('stock').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

/**
 * Orders = a completed (or pending) Stripe checkout.
 * Created/updated from the Stripe webhook, not from the browser.
 */
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  stripeSessionId: text('stripe_session_id').notNull().unique(),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  email: text('email'),
  amountTotalCents: integer('amount_total_cents').notNull(),
  currency: text('currency').notNull().default('usd'),
  status: text('status').notNull().default('pending'), // pending | paid | failed
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

/**
 * Line items for an order. Product name/price are snapshotted so historic
 * orders stay correct even if the product is later edited or deleted.
 */
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, {
    onDelete: 'set null',
  }),
  name: text('name').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  quantity: integer('quantity').notNull(),
})

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type Order = typeof orders.$inferSelect
export type OrderItem = typeof orderItems.$inferSelect
