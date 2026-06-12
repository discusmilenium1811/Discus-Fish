import type { Product } from '../types'
import { formatPrice } from '../lib/format'

const GRADIENTS = [
  'from-cyan-400 to-teal-500',
  'from-rose-400 to-orange-400',
  'from-violet-500 to-fuchsia-500',
  'from-amber-400 to-orange-500',
  'from-sky-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
]

interface ProductCardProps {
  product: Product
  index: number
  onAdd: (product: Product) => void
}

export function ProductCard({ product, index, onAdd }: ProductCardProps) {
  const gradient = GRADIENTS[index % GRADIENTS.length]
  const soldOut = product.stock <= 0

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div
        className={`relative grid h-44 place-items-center bg-gradient-to-br ${gradient}`}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-6xl drop-shadow-sm transition duration-300 group-hover:scale-110">
            🐠
          </span>
        )}
        {product.weightGrams && (
          <span className="absolute right-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {product.weightGrams}g
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold text-slate-900">{product.name}</h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-extrabold text-slate-900">
            {formatPrice(product.priceCents, product.currency)}
          </span>
          <button
            type="button"
            disabled={soldOut}
            onClick={() => onAdd(product)}
            className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {soldOut ? 'Sold out' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  )
}
