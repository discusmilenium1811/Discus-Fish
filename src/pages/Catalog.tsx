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
  icon: string
  title: TranslationKey
  description: TranslationKey
  image: string
}

// Each catalogue category is its own view (own URL via ?group=…) with a real
// banner photo, instead of three stacked sections on one long page.
const GROUPS: Group[] = [
  {
    id: 'fish-food',
    icon: '🐟',
    title: 'catalog.group.food',
    description: 'catalog.group.foodText',
    image: 'discus-portrait.jpg',
  },
  {
    id: 'water-conditioners',
    icon: '💧',
    title: 'catalog.group.water',
    description: 'catalog.group.waterText',
    image: 'planted-tank.jpg',
  },
  {
    id: 'equipment',
    icon: '⚙️',
    title: 'catalog.group.equipment',
    description: 'catalog.group.equipmentText',
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
  const groupCount = (id: GroupId) =>
    available.filter((p) => productGroup(p) === id).length

  // The active category comes from the URL on the Products tab; the Coming tab
  // is its own single view.
  const groupParam = params.get('group')
  const activeGroup: GroupId =
    GROUPS.some((g) => g.id === groupParam) ? (groupParam as GroupId) : 'fish-food'
  const activeMeta = GROUPS.find((g) => g.id === activeGroup) as Group

  const baseList =
    tab === 'coming'
      ? coming
      : available.filter((p) => productGroup(p) === activeGroup)
  const list = baseList.filter((p) => productMatches(p, q))

  // Links preserve the active search query.
  const qSuffix = q ? `&q=${encodeURIComponent(q)}` : ''
  const tabQuery = q ? `?q=${encodeURIComponent(q)}` : ''
  const catLink = (id: GroupId) => `/Cataloge/Products?group=${id}${qSuffix}`

  const banner =
    tab === 'coming'
      ? {
          icon: '✨',
          image: 'discus-school.jpg',
          title: t('catalog.tabComing'),
          desc: t('catalog.comingIntro'),
          count: coming.length,
        }
      : {
          icon: activeMeta.icon,
          image: activeMeta.image,
          title: t(activeMeta.title),
          desc: t(activeMeta.description),
          count: groupCount(activeGroup),
        }

  const pill = (isActive: boolean) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm ${
      isActive
        ? 'bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/25'
        : 'border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
    }`
  const badge = (isActive: boolean) =>
    `rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${
      isActive ? 'bg-slate-900/20 text-slate-900' : 'bg-white/10 text-slate-300'
    }`

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-12">
      <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
        {t('catalog.title')}
      </h1>

      {/* Category navigation — each is its own view */}
      <div className="mt-5 flex flex-wrap items-center gap-2 sm:mt-6">
        {GROUPS.map((g) => {
          const isActive = tab === 'products' && activeGroup === g.id
          return (
            <Link key={g.id} to={catLink(g.id)} className={pill(isActive)}>
              <span aria-hidden="true">{g.icon}</span>
              {t(g.title)}
              <span className={badge(isActive)}>{groupCount(g.id)}</span>
            </Link>
          )
        })}

        <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" aria-hidden="true" />

        <Link
          to={`/Cataloge/NewProductsComingsoon${tabQuery}`}
          className={pill(tab === 'coming')}
        >
          <span aria-hidden="true">✨</span>
          {t('catalog.tabComing')}
          <span className={badge(tab === 'coming')}>{coming.length}</span>
        </Link>

        <button type="button" onClick={() => setDownloadOpen(true)} className={pill(false)}>
          <span aria-hidden="true">⬇</span>
          {t('catalog.download')}
        </button>
      </div>

      <CatalogDownloadDrawer open={downloadOpen} onClose={() => setDownloadOpen(false)} />

      {/* Beautiful category banner with a real photo */}
      <div className="relative mt-6 overflow-hidden rounded-3xl shadow-2xl shadow-black/40 ring-1 ring-white/10">
        <img
          src={`${HOME_IMG}/${banner.image}`}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/25" />
        <div className="relative flex items-center gap-4 px-6 py-7 sm:px-8 sm:py-9">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl ring-1 ring-white/15 sm:h-14 sm:w-14">
            {banner.icon}
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              {banner.title}
            </h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-300 sm:text-sm">
              {banner.desc}
            </p>
          </div>
          <span className="ml-auto hidden shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white ring-1 ring-white/10 sm:block">
            {banner.count} {t('catalog.group.items')}
          </span>
        </div>
      </div>

      {/* Search / refine within the active category */}
      <div className="relative mt-6 max-w-md">
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
