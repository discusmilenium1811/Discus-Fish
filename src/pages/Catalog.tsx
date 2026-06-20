import { Link, useOutletContext } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { useTranslation } from '../i18n/LanguageContext'
import type { StorefrontContext } from '../layouts/StorefrontLayout'

interface CatalogPageProps {
  tab: 'products' | 'coming'
}

export function CatalogPage({ tab }: CatalogPageProps) {
  const { products, addToCart } = useOutletContext<StorefrontContext>()
  const { t } = useTranslation()

  const available = products.filter((p) => !p.isComingSoon)
  const coming = products.filter((p) => p.isComingSoon)
  const list = tab === 'products' ? available : coming

  const tabBase =
    'rounded-full px-4 py-2 text-sm font-semibold transition'
  const active = 'bg-cyan-400 text-slate-900'
  const idle = 'border border-white/15 text-slate-300 hover:bg-white/10'

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-white">
        {t('catalog.title')}
      </h1>

      {/* Section switcher (each links to its own URL) */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/Cataloge/Products"
          className={`${tabBase} ${tab === 'products' ? active : idle}`}
        >
          {t('catalog.tabProducts')} ({available.length})
        </Link>
        <Link
          to="/Cataloge/NewProductsComingsoon"
          className={`${tabBase} ${tab === 'coming' ? active : idle}`}
        >
          {t('catalog.tabComing')} ({coming.length})
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-white/10 bg-white/5 px-6 py-16 text-center text-slate-400">
          {tab === 'products' ? t('catalog.emptyProducts') : t('catalog.emptyComing')}
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} onAdd={addToCart} />
          ))}
        </div>
      )}
    </section>
  )
}
