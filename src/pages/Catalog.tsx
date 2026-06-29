import { useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { CatalogDownloadDrawer } from '../components/CatalogDownloadDrawer'
import { useTranslation } from '../i18n/LanguageContext'
import { productMatches } from '../lib/productSearch'
import type { StorefrontContext } from '../layouts/StorefrontLayout'
import type { Product } from '../types'
import type { TranslationKey } from '../i18n/translations'

interface CatalogPageProps {
  tab: 'products' | 'coming'
}

type GroupId = 'fish-food' | 'water-conditioners' | 'equipment'

const GROUPS: { id: GroupId; icon: string; title: TranslationKey; description: TranslationKey; accent: string }[] = [
  { id: 'fish-food', icon: '🐟', title: 'catalog.group.food', description: 'catalog.group.foodText', accent: 'from-orange-400/15 to-amber-300/5 border-orange-300/20' },
  { id: 'water-conditioners', icon: '💧', title: 'catalog.group.water', description: 'catalog.group.waterText', accent: 'from-cyan-400/15 to-blue-400/5 border-cyan-300/20' },
  { id: 'equipment', icon: '⚙️', title: 'catalog.group.equipment', description: 'catalog.group.equipmentText', accent: 'from-violet-400/15 to-slate-400/5 border-violet-300/20' },
]

function productGroup(product: Product): GroupId {
  const category = `${product.categoryName ?? ''} ${product.categorySlug ?? ''}`.toLowerCase()
  if (/filter|equipment|pump|heater|tool/.test(category)) return 'equipment'
  if (/water|preparation|conditioner|treatment/.test(category)) return 'water-conditioners'
  return 'fish-food'
}

export function CatalogPage({ tab }: CatalogPageProps) {
  const { products, addToCart } = useOutletContext<StorefrontContext>()
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [downloadOpen, setDownloadOpen] = useState(false)
  const q = params.get('q') ?? ''

  const setQ = (v: string) => {
    const p = new URLSearchParams(params)
    if (v) p.set('q', v)
    else p.delete('q')
    setParams(p, { replace: true })
  }
  // Preserve the active query when switching between tabs.
  const tabQuery = q ? `?q=${encodeURIComponent(q)}` : ''

  const available = products.filter((p) => !p.isComingSoon)
  const coming = products.filter((p) => p.isComingSoon)
  const list = (tab === 'products' ? available : coming).filter((p) =>
    productMatches(p, q),
  )
  const grouped = GROUPS.map((group) => ({
    ...group,
    products: list.filter((product) => productGroup(product) === group.id),
  }))

  const tabBase =
    'rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm'
  const active = 'bg-cyan-400 text-slate-900'
  const idle = 'border border-white/15 text-slate-300 hover:bg-white/10'

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-12">
      <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
        {t('catalog.title')}
      </h1>

      {/* Section switcher (each links to its own URL; keeps the search query) */}
      <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-6 sm:gap-3">
        <Link
          to={`/Cataloge/Products${tabQuery}`}
          className={`${tabBase} ${tab === 'products' ? active : idle}`}
        >
          {t('catalog.tabProducts')} ({available.length})
        </Link>
        <Link
          to={`/Cataloge/NewProductsComingsoon${tabQuery}`}
          className={`${tabBase} ${tab === 'coming' ? active : idle}`}
        >
          {t('catalog.tabComing')} ({coming.length})
        </Link>

        <button
          type="button"
          onClick={() => setDownloadOpen(true)}
          className={`${tabBase} ${idle}`}
        >
          {t('catalog.download')}
        </button>
      </div>

      <CatalogDownloadDrawer open={downloadOpen} onClose={() => setDownloadOpen(false)} />

      {/* Search / refine within the catalogue */}
      <div className="relative mt-5 max-w-md">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          🔎
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder')}
          className="w-full rounded-full border border-white/15 bg-slate-900/70 py-2.5 pl-11 pr-9 text-sm text-white placeholder-slate-400 outline-none transition focus:border-cyan-400"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ('')}
            aria-label={t('catalog.close')}
            className="absolute right-3 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-white/10 bg-white/5 px-4 py-12 text-center text-sm text-slate-400 sm:mt-12 sm:px-6 sm:py-16 sm:text-base">
          {q
            ? t('search.noResults')
            : tab === 'products'
              ? t('catalog.emptyProducts')
              : t('catalog.emptyComing')}
        </p>
      ) : (
        <div className="mt-8">
          <div className="grid gap-3 sm:grid-cols-3">
            {grouped.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className={`flex items-center gap-3 rounded-2xl border bg-gradient-to-br p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/40 ${group.accent}`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-xl ring-1 ring-white/10" aria-hidden="true">{group.icon}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold text-white">{t(group.title)}</span>
                  <span className="mt-0.5 block text-xs text-slate-400">{group.products.length} {t('catalog.group.items')}</span>
                </span>
              </a>
            ))}
          </div>

          <div className="mt-10 space-y-14">
            {grouped.filter((group) => group.products.length > 0).map((group) => (
              <section key={group.id} id={group.id} className="scroll-mt-28">
                <div className={`rounded-2xl border bg-gradient-to-r px-5 py-4 ${group.accent}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden="true">{group.icon}</span>
                    <div>
                      <h2 className="text-xl font-black text-white sm:text-2xl">{t(group.title)}</h2>
                      <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">{t(group.description)}</p>
                    </div>
                    <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">{group.products.length}</span>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                  {group.products.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} onAdd={addToCart} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
