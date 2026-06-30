import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import type { TranslationKey } from '../i18n/translations'
import { HOME_IMG } from '../lib/homeImages'

interface Block {
  image: string
  titleKey: TranslationKey
  textKey: TranslationKey
  accent: string
}

// Short, editorial summaries of the product range — image-led, alternating
// left/right, each pointing into the catalogue (no buy cards).
const BLOCKS: Block[] = [
  {
    image: 'discus-red.jpg',
    titleKey: 'home.story.1.title',
    textKey: 'home.story.1.text',
    accent: 'text-rose-200',
  },
  {
    image: 'discus-school.jpg',
    titleKey: 'home.story.2.title',
    textKey: 'home.story.2.text',
    accent: 'text-cyan-200',
  },
  {
    image: 'fish-plants.jpg',
    titleKey: 'home.story.3.title',
    textKey: 'home.story.3.text',
    accent: 'text-emerald-200',
  },
]

export function HomeStory() {
  const { t } = useTranslation()
  return (
    <section id="products" className="relative overflow-hidden bg-slate-950/60">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(244,114,182,0.12),transparent_30%),radial-gradient(circle_at_88%_85%,rgba(34,211,238,0.12),transparent_30%)]" />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200 sm:text-sm">
            {t('home.eyebrow')}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            {t('home.heading')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-lg">
            {t('home.subtitle')}
          </p>
        </div>

        <div className="mt-14 space-y-10 sm:mt-16 sm:space-y-16">
          {BLOCKS.map((b, index) => {
            const imageRight = index % 2 === 1
            return (
              <div
                key={b.titleKey}
                className="grid items-center gap-6 sm:gap-10 md:grid-cols-2"
              >
                <div
                  className={`group relative overflow-hidden rounded-3xl shadow-2xl shadow-black/40 ring-1 ring-white/10 ${
                    imageRight ? 'md:order-2' : ''
                  }`}
                >
                  <img
                    src={`${HOME_IMG}/${b.image}`}
                    alt={t(b.titleKey)}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 to-transparent" />
                </div>

                <div className={imageRight ? 'md:order-1' : ''}>
                  <h3 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    {t(b.titleKey)}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                    {t(b.textKey)}
                  </p>
                  <Link
                    to="/Cataloge/Products"
                    className={`group mt-6 inline-flex items-center gap-2 text-sm font-bold ${b.accent}`}
                  >
                    {t('home.story.cta')}
                    <span aria-hidden="true" className="transition group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
