import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import type { TranslationKey } from '../i18n/translations'
import { HOME_IMG } from '../lib/homeImages'

interface Category {
  image: string
  titleKey: TranslationKey
  textKey: TranslationKey
  /** Deep-links straight into that catalogue category view. */
  to: string
  /** Bottom-up colour wash, one per card, to keep the trio lively. */
  wash: string
}

// The three catalogue worlds. Each whole card links into its catalogue category.
const CATEGORIES: Category[] = [
  {
    image: 'discus-portrait.jpg',
    titleKey: 'catalog.group.food',
    textKey: 'catalog.group.foodText',
    to: '/Cataloge/Products?group=fish-food',
    wash: 'from-rose-500/45',
  },
  {
    image: 'planted-tank.jpg',
    titleKey: 'catalog.group.water',
    textKey: 'catalog.group.waterText',
    to: '/Cataloge/Products?group=water-conditioners',
    wash: 'from-cyan-500/45',
  },
  {
    image: 'aquascape.jpg',
    titleKey: 'catalog.group.equipment',
    textKey: 'catalog.group.equipmentText',
    to: '/Cataloge/Products?group=equipment',
    wash: 'from-emerald-500/45',
  },
]

export function HomeCategories() {
  const { t } = useTranslation()
  return (
    <section className="relative bg-slate-950/70">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200 sm:text-sm">
            {t('home.cats.eyebrow')}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {t('home.cats.heading')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            {t('home.cats.subtitle')}
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:mt-14 md:grid-cols-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.titleKey}
              to={c.to}
              className="group relative block overflow-hidden rounded-3xl shadow-2xl shadow-black/40 ring-1 ring-white/10 transition duration-300 hover:ring-cyan-300/40"
            >
              <div className="aspect-[4/5] w-full overflow-hidden">
                <img
                  src={`${HOME_IMG}/${c.image}`}
                  alt={t(c.titleKey)}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
                />
              </div>
              <div
                className={`absolute inset-0 bg-gradient-to-t ${c.wash} via-slate-950/35 to-slate-950/90`}
              />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  {t(c.titleKey)}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-200">
                  {t(c.textKey)}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-cyan-200">
                  {t('home.cats.explore')}
                  <span aria-hidden="true" className="transition group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
