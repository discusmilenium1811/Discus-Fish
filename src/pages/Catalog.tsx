import { useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { CatalogDownloadDrawer } from '../components/CatalogDownloadDrawer'
import { useTranslation } from '../i18n/LanguageContext'
import { productMatches } from '../lib/productSearch'
import { HOME_IMG } from '../lib/homeImages'
import type { StorefrontContext } from '../layouts/StorefrontLayout'
import type { Product } from '../types'
import type { TranslationKey } from '../i18n/translations'

interface CatalogPageProps {
  tab: 'products' | 'coming'
}

type GroupId = 'fish-food' | 'water-conditioners' | 'equipment'

interface Group {
  id: GroupId
  title: TranslationKey
  image: string
}

// Each catalogue category is its own view (own URL via ?group=…) with a real
// banner photo, instead of three stacked sections on one long page.
const GROUPS: Group[] = [
  {
    id: 'fish-food',
    title: 'catalog.group.food',
    image: 'discus-portrait.jpg',
  },
  {
    id: 'water-conditioners',
    title: 'catalog.group.water',
    image: 'planted-tank.jpg',
  },
  {
    id: 'equipment',
    title: 'catalog.group.equipment',
    image: 'aquascape.jpg',
  },
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

  const available = products.filter((p) => !p.isComingSoon)
  const coming = products.filter((p) => p.isComingSoon)
  const pageProducts = tab === 'coming' ? coming : available
  const groupCount = (id: GroupId) =>
    pageProducts.filter((p) => productGroup(p) === id).length

  // Both catalogue pages have their own category-filtered views.
  const groupParam = params.get('group')
  const activeGroup: GroupId =
    GROUPS.some((g) => g.id === groupParam) ? (groupParam as GroupId) : 'fish-food'

  const baseList = pageProducts.filter((p) => productGroup(p) === activeGroup)
  const list = baseList.filter((p) => productMatches(p, q))

  // Links preserve the active search query.
  const qSuffix = q ? `&q=${encodeURIComponent(q)}` : ''
  const pagePath =
    tab === 'coming' ? '/Cataloge/NewProductsComingsoon' : '/Cataloge/Products'
  const catLink = (id: GroupId) => `${pagePath}?group=${id}${qSuffix}`

  const pill = (isActive: boolean) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm ${
      isActive
        ? 'bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/25'
        : 'border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
    }`
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-12">
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        <Link
          to={`/Cataloge/Products?group=${activeGroup}${qSuffix}`}
          aria-current={tab === 'products' ? 'page' : undefined}
          className={`flex h-16 w-56 shrink-0 items-center justify-between rounded-2xl px-5 shadow-xl shadow-black/25 ring-1 transition sm:w-64 ${
            tab === 'products'
              ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-200'
              : 'bg-slate-900/85 text-white ring-white/15 hover:bg-slate-800 hover:ring-cyan-300/60'
          }`}
        >
          <span className="text-base font-extrabold sm:text-lg">{t('catalog.tabProducts')}</span>
          <span className="rounded-full bg-black/15 px-2 py-1 text-xs font-bold">{available.length}</span>
        </Link>

        <Link
          to={`/Cataloge/NewProductsComingsoon?group=${activeGroup}${qSuffix}`}
          aria-current={tab === 'coming' ? 'page' : undefined}
          className={`flex h-16 w-56 shrink-0 items-center justify-between rounded-2xl px-5 shadow-xl shadow-black/25 ring-1 transition sm:w-64 ${
            tab === 'coming'
              ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-200'
              : 'bg-slate-900/85 text-white ring-white/15 hover:bg-slate-800 hover:ring-cyan-300/60'
          }`}
        >
          <span className="text-base font-extrabold sm:text-lg">{t('catalog.tabComing')}</span>
          <span className="rounded-full bg-black/15 px-2 py-1 text-xs font-bold">{coming.length}</span>
        </Link>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3 sm:mt-8">
        <h1 className="shrink-0 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          {t('catalog.title')}
        </h1>

        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            🔎
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search.placeholder')}
            aria-label={t('search.placeholder')}
            className="w-full rounded-full border border-white/15 bg-slate-900/70 py-2 pl-10 pr-9 text-sm text-white placeholder-slate-400 outline-none transition focus:border-cyan-400"
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

        <button
          type="button"
          onClick={() => setDownloadOpen(true)}
          className={pill(false)}
        >
          <span aria-hidden="true">⬇</span>
          {t('catalog.download')}
        </button>
      </div>

      {/* Category navigation — the same photo-led cards used on the home page */}
      <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
        {GROUPS.map((g) => {
          const isActive = activeGroup === g.id
          return (
            <Link
              key={g.id}
              to={catLink(g.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative block min-h-36 overflow-hidden rounded-2xl shadow-xl shadow-black/30 ring-1 transition duration-300 sm:aspect-[5/3] sm:min-h-0 ${
                isActive
                  ? 'ring-2 ring-cyan-300 shadow-cyan-500/15'
                  : 'ring-white/10 hover:ring-cyan-300/50'
              }`}
            >
              <img
                src={`${HOME_IMG}/${g.image}`}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-950/10" />
              <span className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4 sm:p-5">
                <span className="min-w-0 text-sm font-extrabold leading-tight text-white sm:text-base">
                  {t(g.title)}
                </span>
                <span className="ml-auto shrink-0 rounded-full bg-white/15 px-2 py-1 text-[0.65rem] font-bold text-white backdrop-blur-sm ring-1 ring-white/15">
                  {groupCount(g.id)}
                </span>
              </span>
            </Link>
          )
        })}
      </div>

      <CatalogDownloadDrawer open={downloadOpen} onClose={() => setDownloadOpen(false)} />

      {list.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-white/10 bg-white/5 px-4 py-12 text-center text-sm text-slate-400 sm:mt-12 sm:px-6 sm:py-16 sm:text-base">
          {q
            ? t('search.noResults')
            : tab === 'products'
              ? t('catalog.emptyProducts')
              : t('catalog.emptyComing')}
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {list.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onAdd={addToCart}
            />
          ))}
        </div>
      )}
    </section>
  )
}
