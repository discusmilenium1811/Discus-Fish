import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { legal, LEGAL_LAST_UPDATED, type LegalDocId } from '../i18n/legal'

/** Route path for each legal document, so the cross-links stay in one place. */
const DOC_PATHS: Record<LegalDocId, string> = {
  terms: '/terms',
  privacy: '/privacy',
  refunds: '/refund-policy',
}

const DOC_ORDER: LegalDocId[] = ['terms', 'privacy', 'refunds']

/**
 * Renders one legal document (terms / privacy / refunds) from `src/i18n/legal.ts`
 * in the reader's language, with links across to the other two.
 */
export function LegalPage({ doc }: { doc: LegalDocId }) {
  const { t, lang } = useTranslation()
  const content = legal[lang][doc]
  const locale = lang === 'el' ? 'el-GR' : lang === 'bg' ? 'bg-BG' : 'en-GB'
  const updated = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(
    new Date(LEGAL_LAST_UPDATED),
  )

  return (
    <section className="relative min-h-[70vh] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.16),transparent_36%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_32%),linear-gradient(to_bottom,rgba(2,6,23,0.92),rgba(2,6,23,0.98))]" />

      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-18">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">{t('legal.eyebrow')}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{content.title}</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">{content.intro}</p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
            {t('legal.updated')}: {updated}
          </p>
        </header>

        <div className="mt-10 space-y-9">
          {content.sections.map((section) => (
            <article key={section.heading}>
              <h2 className="text-lg font-extrabold text-white">{section.heading}</h2>
              {section.body?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-7 text-slate-300">
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="mt-3 space-y-2">
                  {section.list.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-7 text-slate-300">
                      <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        <nav className="mt-12 border-t border-white/10 pt-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{t('legal.related')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DOC_ORDER.filter((id) => id !== doc).map((id) => (
              <Link
                key={id}
                to={DOC_PATHS[id]}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-200"
              >
                {legal[lang][id].title}
              </Link>
            ))}
            <Link
              to="/contact"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-200"
            >
              {t('footer.contact')}
            </Link>
          </div>
        </nav>
      </div>
    </section>
  )
}
