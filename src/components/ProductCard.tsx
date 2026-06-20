import type { Product } from '../types'
import { formatPrice } from '../lib/format'
import { useTranslation } from '../i18n/LanguageContext'

// Subtle discus photos used only as a faint backdrop when a product has no
// packaging shot of its own. Kept low-opacity so they never dominate the card.
const FALLBACK_IMAGES = [
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
  const comingSoon = product.isComingSoon
  const soldOut = product.stock <= 0

  // A real packaging shot is rendered crisp and prominent in the lower-right
  // corner; the generic discus fallback stays faint so it reads as a backdrop.
  const hasImage = Boolean(product.imageUrl)
  const image = product.imageUrl ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]

  return (
    <div className="group relative flex min-h-[19rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl shadow-black/30 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/10">
      {/* Packaging image as the card's background — contained in the bottom-right
          with empty space around it, never stretched to fill the whole card. */}
      <img
        src={image}
        alt={product.name}
        loading="lazy"
        className={`pointer-events-none absolute bottom-3 right-3 h-40 w-3/5 object-contain object-right-bottom drop-shadow-2xl transition duration-300 group-hover:scale-105 ${
          hasImage ? 'opacity-95' : 'opacity-20'
        }`}
      />

      {/* Gradient keeps the heading + text legible over the artwork. */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/95 via-slate-950/75 to-transparent" />

      {/* Badges */}
      {comingSoon && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-cyan-400/90 px-2.5 py-1 text-xs font-bold text-slate-900 backdrop-blur">
          {t('product.comingSoon')}
        </span>
      )}
      {product.weightGrams && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-slate-950/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
          {product.weightGrams}g
        </span>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col p-5">
        <h3 className="max-w-[80%] text-base font-bold text-white">{product.name}</h3>
        <p className="mt-1.5 max-w-[88%] flex-1 text-sm leading-relaxed text-slate-300">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          {comingSoon ? (
            <span className="text-base font-bold text-cyan-300">
              {t('product.comingSoon')}
            </span>
          ) : (
            <span className="text-lg font-extrabold text-white">
              {formatPrice(product.priceCents, product.currency)}
            </span>
          )}
          <button
            type="button"
            disabled={comingSoon || soldOut}
            onClick={() => onAdd(product)}
            className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
          >
            {comingSoon
              ? t('product.comingSoon')
              : soldOut
                ? t('product.soldOut')
                : t('product.addToCart')}
          </button>
        </div>
      </div>
    </div>
  )
}
