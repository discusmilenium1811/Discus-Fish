import type { Product } from '../types'
import { ProductCard } from './ProductCard'

interface ProductGridProps {
  products: Product[]
  onAdd: (product: Product) => void
}

export function ProductGrid({ products, onAdd }: ProductGridProps) {
  return (
    <section id="products" className="mx-auto max-w-6xl px-5 py-20">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Shop our discus foods
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-500">
          Carefully formulated blends to keep your discus colorful, active, and
          thriving.
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
    </section>
  )
}
