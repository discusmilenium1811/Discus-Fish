import type { Product } from '../types'
import { formatPrice } from '../lib/format'

interface ComingSoonItem {
  title: string
  image: string
  description: string
}

interface HomeProductShowcaseProps {
  products: Product[]
}

const COMING_SOON_ITEMS: ComingSoonItem[] = [
  {
    title: 'Vitamin Shot',
    image: '/pictures/New%20products%20Coming%20Soon/vitamin-shot.png',
    description: 'A bright boost for daily vitality, color, and recovery.',
  },
  {
    title: 'Anti Stress',
    image: '/pictures/New%20products%20Coming%20Soon/anti-stress.png',
    description: 'Gentle support for calmer fish during changes and transport.',
  },
  {
    title: 'NaturePur Artemia',
    image: '/pictures/New%20products%20Coming%20Soon/naturepur-artemia-adult.png',
    description: 'Natural artemia nutrition for lively feeding and clean energy.',
  },
  {
    title: 'FD Bloodworms XL',
    image: '/pictures/New%20products%20Coming%20Soon/fd-bloodworms-xl.png',
    description: 'A rich treat-style food made for bigger, showy appetites.',
  },
  {
    title: 'Black Water Nitrate Remover',
    image: '/pictures/New%20products%20Coming%20Soon/black-water-nitrate-remover.png',
    description: 'Aquarium care with a natural black-water inspired finish.',
  },
  {
    title: 'Firstbite Daphnia',
    image: '/pictures/New%20products%20Coming%20Soon/firstbite-daphnia.png',
    description: 'Tiny, clean first food for young fish and delicate feeders.',
  },
]

const PRODUCT_FALLBACKS: Product[] = [
  {
    id: 'home-grand-champion',
    slug: 'grand-champion-granulate',
    name: 'Grand Champion Granulate',
    description: 'A colorful daily granulate for strong growth and show-ready condition.',
    priceCents: 1599,
    currency: 'usd',
    imageUrl: '/pictures/products/grand-champion-granulate.png',
    stock: 10,
    isActive: true,
  },
  {
    id: 'home-for-discus-daily',
    slug: 'for-discus-daily-granulate',
    name: 'For Discus Daily Granulate',
    description: 'Balanced everyday food for vibrant discus and steady appetite.',
    priceCents: 1299,
    currency: 'usd',
    imageUrl: '/pictures/products/for-discus-daily-granulate.png',
    stock: 10,
    isActive: true,
  },
  {
    id: 'home-red-color-booster',
    slug: 'red-color-booster',
    name: 'Red Color Booster',
    description: 'Designed to bring out warmer reds with a compact feeding routine.',
    priceCents: 1199,
    currency: 'usd',
    imageUrl: '/pictures/products/red-color-booster.png',
    stock: 10,
    isActive: true,
  },
  {
    id: 'home-blue-color-booster',
    slug: 'blue-color-booster',
    name: 'Blue Color Booster',
    description: 'A vivid formula for cooler tones, sparkle, and active display.',
    priceCents: 1199,
    currency: 'usd',
    imageUrl: '/pictures/products/blue-color-booster.png',
    stock: 10,
    isActive: true,
  },
  {
    id: 'home-artemia-soft',
    slug: 'artemia-50-soft-granulate',
    name: 'Artemia 50 Soft Granulate',
    description: 'Soft, protein-rich bites with artemia for eager feeding.',
    priceCents: 1399,
    currency: 'usd',
    imageUrl: '/pictures/products/artemia-50-soft-granulate.png',
    stock: 10,
    isActive: true,
  },
  {
    id: 'home-beef-heart',
    slug: 'beef-heart-soft-granulate',
    name: 'Beef Heart Soft Granulate',
    description: 'A hearty soft granulate for growth phases and full-bodied fish.',
    priceCents: 1499,
    currency: 'usd',
    imageUrl: '/pictures/products/beef-heart-soft-granulate.png',
    stock: 10,
    isActive: true,
  },
]

const CARD_STYLES = [
  {
    shell: 'from-cyan-400/30 via-slate-900 to-rose-500/25',
    glow: 'bg-cyan-300/20',
    price: 'text-cyan-200',
  },
  {
    shell: 'from-amber-300/30 via-slate-900 to-teal-400/25',
    glow: 'bg-amber-300/20',
    price: 'text-amber-200',
  },
  {
    shell: 'from-fuchsia-400/25 via-slate-900 to-sky-400/25',
    glow: 'bg-fuchsia-300/20',
    price: 'text-fuchsia-200',
  },
  {
    shell: 'from-lime-300/25 via-slate-900 to-orange-400/25',
    glow: 'bg-lime-300/20',
    price: 'text-lime-200',
  },
]

function shortText(text: string): string {
  if (text.length <= 92) return text
  return `${text.slice(0, 89).trim()}...`
}

export function HomeProductShowcase({ products }: HomeProductShowcaseProps) {
  const liveProducts = products
    .filter((product) => !product.isComingSoon && product.imageUrl)
    .slice(0, 6)

  const featuredProducts = [
    ...liveProducts,
    ...PRODUCT_FALLBACKS.filter(
      (fallback) => !liveProducts.some((product) => product.slug === fallback.slug),
    ),
  ].slice(0, 6)
  const cards = [
    ...featuredProducts.map((product) => ({
      kind: 'product' as const,
      title: product.name,
      image: product.imageUrl ?? '',
      description: shortText(product.description),
      footer: formatPrice(product.priceCents, product.currency),
    })),
    ...COMING_SOON_ITEMS.map((item) => ({
      kind: 'coming' as const,
      title: item.title,
      image: item.image,
      description: item.description,
      footer: 'Coming soon',
    })),
  ]

  return (
    <section id="products" className="relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_85%_25%,rgba(244,114,182,0.18),transparent_26%),radial-gradient(circle_at_50%_90%,rgba(250,204,21,0.14),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-200">
            Colorful nutrition
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Food and care that look as good as they feed.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            A brighter Home selection with real product photos, quick notes, and a clean
            price or launch status at a glance.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card, index) => {
            const style = CARD_STYLES[index % CARD_STYLES.length]

            return (
              <article
                key={`${card.kind}-${card.title}`}
                className={`group relative min-h-[27rem] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${style.shell} p-px shadow-2xl shadow-black/30 transition duration-300 hover:-translate-y-1 hover:border-white/25`}
              >
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-slate-950/82 p-4">
                  <div
                    className={`absolute -right-16 -top-16 h-36 w-36 rounded-full ${style.glow} blur-3xl`}
                  />
                  <div className="relative z-10 min-h-14">
                    <h3 className="text-lg font-extrabold leading-tight text-white">
                      {card.title}
                    </h3>
                  </div>

                  <div className="relative z-10 my-4 grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-white/[0.07]">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />
                    <img
                      src={card.image}
                      alt={card.title}
                      loading="lazy"
                      className="relative z-10 h-full w-full object-contain p-4 drop-shadow-2xl transition duration-300 group-hover:scale-105"
                    />
                  </div>

                  <p className="relative z-10 min-h-16 text-sm leading-relaxed text-slate-300">
                    {card.description}
                  </p>

                  <div className="relative z-10 mt-auto flex items-center justify-between border-t border-white/10 pt-4">
                    <span
                      className={`text-lg font-extrabold ${
                        card.kind === 'coming' ? 'text-rose-200' : style.price
                      }`}
                    >
                      {card.footer}
                    </span>
                    <span className="h-2.5 w-2.5 rounded-full bg-white/70 shadow-[0_0_18px_rgba(255,255,255,0.7)]" />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
