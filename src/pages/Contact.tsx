import { useTranslation } from '../i18n/LanguageContext'

const CONTACTS = [
  {
    key: 'email' as const,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-7 w-7">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m2 7 10 7 10-7" />
      </svg>
    ),
    href: 'mailto:discusmilenium@outlook.com',
    value: 'discusmilenium@outlook.com',
    color: 'hover:border-cyan-400/50 hover:bg-cyan-500/5',
    iconColor: 'text-cyan-400',
  },
  {
    key: 'whatsapp' as const,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.1 1.508 5.83L.057 23.07a.75.75 0 0 0 .921.921l5.24-1.451A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.681-.513-5.21-1.407l-.374-.215-3.876 1.073 1.073-3.876-.215-.374A9.955 9.955 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
      </svg>
    ),
    href: 'https://wa.me/35796316020',
    value: '+357 96 316 020',
    color: 'hover:border-green-400/50 hover:bg-green-500/5',
    iconColor: 'text-green-400',
  },
  {
    key: 'facebook' as const,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
      </svg>
    ),
    href: 'https://www.facebook.com/search/top/?q=discus%20milenium',
    value: 'Discus Milenium',
    color: 'hover:border-blue-400/50 hover:bg-blue-500/5',
    iconColor: 'text-blue-400',
  },
  {
    key: 'instagram' as const,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
    href: 'https://www.instagram.com/mileniumdiscus',
    value: '@mileniumdiscus',
    color: 'hover:border-pink-400/50 hover:bg-pink-500/5',
    iconColor: 'text-pink-400',
  },
  {
    key: 'tiktok' as const,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.29 6.29 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.97a8.16 8.16 0 0 0 4.77 1.52V7.04a4.85 4.85 0 0 1-1-.35z" />
      </svg>
    ),
    href: 'https://www.tiktok.com/@discus.millennium',
    value: '@discus.millennium',
    color: 'hover:border-white/30 hover:bg-white/5',
    iconColor: 'text-white',
  },
]

export function ContactPage() {
  const { t } = useTranslation()

  return (
    <section className="relative min-h-[70vh] overflow-hidden">
      <div
        className="absolute inset-0 bg-fixed bg-cover bg-center"
        style={{ backgroundImage: "url('/pictures/hero-wide.jpg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-slate-950/90" />

      <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-12 text-center sm:mb-16">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            {t('contact.heading')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            {t('contact.intro')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CONTACTS.map((c) => (
            <a
              key={c.key}
              href={c.href}
              target={c.key === 'email' ? undefined : '_blank'}
              rel={c.key === 'email' ? undefined : 'noopener noreferrer'}
              className={`flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition ${c.color}`}
            >
              <span className={c.iconColor}>{c.icon}</span>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t(`contact.${c.key}` as Parameters<typeof t>[0])}
                </div>
                <div className="mt-0.5 truncate text-sm font-bold text-white sm:text-base">
                  {c.value}
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {t(`contact.${c.key}Label` as Parameters<typeof t>[0])}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
