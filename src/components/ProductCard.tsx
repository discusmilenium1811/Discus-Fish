import type { Product } from '../types'
import { formatPrice } from '../lib/format'
import { useTranslation } from '../i18n/LanguageContext'

// Discus photos used as card thumbnails when a product has no image of its own.
// The logo is intentionally excluded — it's only the brand mark.
const CARD_IMAGES = [
  '/pictures/discus-closeup.webp',
  '/pictures/discus-tank.jpg',
  '/pictures/hero-wide.jpg',
  '/pictures/discus-row.webp',
]

interface ProductCardProps {
  product: Product
  index: number
  onAdd: (product: Product) => void
}

export function ProductCard({ product, index, onAdd }: ProductCardProps) {
  const { t } = useTranslation()
  const fallback = CARD_IMAGES[index % CARD_IMAGES.length]
  const soldOut = product.stock <= 0

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl shadow-black/30 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/10">
      <div className="relative h-44 overflow-hidden">
        <img
          src={product.imageUrl ?? fallback}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
        {product.weightGrams && (
          <span className="absolute right-3 top-3 rounded-full bg-slate-950/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            {product.weightGrams}g
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold text-white">{product.name}</h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-300">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-extrabold text-white">
            {formatPrice(product.priceCents, product.currency)}
          </span>
          <button
            type="button"
            disabled={soldOut}
            onClick={() => onAdd(product)}
            className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
          >
            {soldOut ? t('product.soldOut') : t('product.addToCart')}
          </button>
        </div>
      </div>
    </div>
  )
}
