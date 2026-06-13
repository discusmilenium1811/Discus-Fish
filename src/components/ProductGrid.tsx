import type { Product } from '../types'
import { ProductCard } from './ProductCard'
import { useTranslation } from '../i18n/LanguageContext'

interface ProductGridProps {
  products: Product[]
  onAdd: (product: Product) => void
}

export function ProductGrid({ products, onAdd }: ProductGridProps) {
  const { t } = useTranslation()
  return (
    <section id="products" className="relative overflow-hidden">
      {/* Discus photo background with a dark overlay for readability */}
      <div
        className="absolute inset-0 bg-fixed bg-cover bg-center"
        style={{ backgroundImage: "url('/pictures/discus-tank.jpg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-slate-950/85" />

      <div className="relative mx-auto max-w-6xl px-5 py-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {t('products.title')}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            {t('products.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              index={i}
              onAdd={onAdd}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
