import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer id="footer" className="border-t border-white/10 bg-slate-950/85 text-slate-300">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6">
        <div className="grid items-start gap-8 lg:grid-cols-[0.75fr_1.4fr_0.8fr] lg:gap-10">
          <div className="max-w-xs">
            <Link to="/" className="inline-flex items-center" aria-label="DiscusFish home">
              <img
                src="/pictures/Logo/viber_image_2026-06-20_16-16-33-937.jpg"
                alt="DiscusFish logo"
                className="h-24 w-auto rounded-2xl object-contain ring-1 ring-white/15 sm:h-28"
              />
            </Link>
            <p className="mt-3 text-xs leading-5 text-slate-400">{t('footer.tagline')}</p>
          </div>

          <section className="relative w-fit max-w-full justify-self-center overflow-hidden rounded-2xl border border-cyan-300/15 bg-white/[0.035] p-3">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-500 text-sm font-black text-slate-950">KB</div>
                <div>
                  <p className="text-[0.58rem] font-extrabold uppercase tracking-[0.2em] text-cyan-300">{t('footer.creatorEyebrow')}</p>
                  <h2 className="text-lg font-black text-white">Kuman Bazitov</h2>
                  <p className="text-[0.65rem] font-semibold text-emerald-300">{t('footer.creatorRole')}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <a href="https://mail.google.com/mail/?view=cm&fs=1&to=kumanbazitov@gmail.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[0.62rem] font-bold text-white transition hover:border-cyan-300/40">
                  <MailIcon /> kumanbazitov@gmail.com
                </a>
                <a href="https://github.com/Kuman-Bazitov-BG" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[0.62rem] font-bold text-white transition hover:border-cyan-300/40">
                  <GitHubIcon /> Kuman-Bazitov-BG
                </a>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-8 text-sm lg:pt-2">
            <div>
              <h4 className="font-semibold text-white">{t('footer.shop')}</h4>
              <ul className="mt-3 space-y-2 text-xs text-slate-400">
                <li><Link to="/Cataloge/Products" className="transition hover:text-teal-400">{t('footer.allFoods')}</Link></li>
                <li><Link to="/Cataloge/Products" className="transition hover:text-teal-400">{t('footer.bestSellers')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">{t('footer.support')}</h4>
              <ul className="mt-3 space-y-2 text-xs text-slate-400">
                <li><Link to="/why-us" className="transition hover:text-teal-400">{t('footer.whyUs')}</Link></li>
                <li><Link to="/contact" className="transition hover:text-teal-400">{t('footer.contact')}</Link></li>
                <li><Link to="/shipping-prices" className="transition hover:text-teal-400">{t('nav.shippingPrices')}</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} DiscusFish. {t('footer.rights')}</span>
          <span>{t('footer.craftedBy')} <a href="https://github.com/Kuman-Bazitov-BG" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-300 transition hover:text-cyan-300">Kuman Bazitov</a></span>
        </div>
      </div>
    </footer>
  )
}

function MailIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
}

function GitHubIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true"><path d="M12 .7A11.5 11.5 0 0 0 8.36 23.1c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.29-5.27-1.29-5.27-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.75 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.71 5.4-5.29 5.68.42.36.79 1.07.79 2.16v3.2c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" /></svg>
}
