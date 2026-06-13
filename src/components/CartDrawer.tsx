import { useState } from 'react'
import type { CartItem } from '../hooks/useCart'
import { formatPrice } from '../lib/format'
import { createCheckout } from '../lib/api'

const ITEM_FALLBACK = '/pictures/discus-closeup.webp'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
  items: CartItem[]
  totalCents: number
  onSetQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  onClear: () => void
}

export function CartDrawer({
  open,
  onClose,
  items,
  totalCents,
  onSetQuantity,
  onRemove,
  onClear,
}: CartDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    setLoading(true)
    setError(null)
    try {
      const { url } = await createCheckout(
        items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      )
      window.location.href = url
    } catch {
      setError(
        'Checkout isn’t available yet — the payments back-end still needs to be configured.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-slate-950/70 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-slate-900 text-slate-100 shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-bold text-white">Your cart</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
            <span className="text-5xl">🛒</span>
            <p className="font-semibold text-slate-200">Your cart is empty</p>
            <p className="text-sm text-slate-400">
              Add some food to keep your discus happy.
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <img
                  src={item.product.imageUrl ?? ITEM_FALLBACK}
                  alt={item.product.name}
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      {item.product.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => onRemove(item.product.id)}
                      className="text-xs text-slate-400 hover:text-rose-400"
                      aria-label={`Remove ${item.product.name}`}
                    >
                      Remove
                    </button>
                  </div>
                  <p className="text-sm text-slate-400">
                    {formatPrice(item.product.priceCents, item.product.currency)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onSetQuantity(item.product.id, item.quantity - 1)
                      }
                      className="grid h-7 w-7 place-items-center rounded-full border border-white/20 text-slate-200 transition hover:bg-white/10"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onSetQuantity(item.product.id, item.quantity + 1)
                      }
                      className="grid h-7 w-7 place-items-center rounded-full border border-white/20 text-slate-200 transition hover:bg-white/10"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={onClear}
              className="text-xs font-medium text-slate-400 hover:text-rose-400"
            >
              Clear cart
            </button>
          </div>
        )}

        {items.length > 0 && (
          <div className="border-t border-white/10 px-5 py-4">
            {error && (
              <p className="mb-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300">
                {error}
              </p>
            )}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-400">Subtotal</span>
              <span className="text-xl font-extrabold text-white">
                {formatPrice(totalCents)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="w-full rounded-full bg-cyan-400 py-3 text-sm font-bold text-slate-900 transition hover:bg-cyan-300 disabled:opacity-60"
            >
              {loading ? 'Redirecting…' : 'Checkout'}
            </button>
            <p className="mt-2 text-center text-xs text-slate-500">
              Secure payment powered by Stripe
            </p>
          </div>
        )}
      </aside>
    </>
  )
}
