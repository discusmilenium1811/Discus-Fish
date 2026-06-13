import { useTranslation } from '../i18n/LanguageContext'
import type { TranslationKey } from '../i18n/translations'

const FEATURES: { icon: string; titleKey: TranslationKey; textKey: TranslationKey }[] = [
  { icon: '🎨', titleKey: 'features.color.title', textKey: 'features.color.text' },
  { icon: '🧬', titleKey: 'features.vet.title', textKey: 'features.vet.text' },
  { icon: '💧', titleKey: 'features.water.title', textKey: 'features.water.text' },
  {
    icon: '🚚',
    titleKey: 'features.shipping.title',
    textKey: 'features.shipping.text',
  },
]

export function Features() {
  const { t } = useTranslation()
  return (
    <section id="features" className="relative overflow-hidden">
      {/* Discus photo background with a strong dark overlay */}
      <div
        className="absolute inset-0 bg-fixed bg-cover bg-center"
        style={{ backgroundImage: "url('/pictures/hero-wide.jpg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-slate-950/88" />

      <div className="relative mx-auto max-w-6xl px-5 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {t('features.title')}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.titleKey}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md transition hover:border-cyan-400/40 hover:bg-white/10"
            >
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-2xl ring-1 ring-white/10">
                {f.icon}
              </div>
              <h3 className="mt-4 font-bold text-white">{t(f.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {t(f.textKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
