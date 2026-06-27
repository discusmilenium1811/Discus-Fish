import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { useCart } from '../hooks/useCart'

export function CheckoutSuccess() {
  const { t } = useTranslation()
  const { clear } = useCart()

  // Clear the cart once we land here — payment is confirmed.
  useEffect(() => { clear() }, [])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
        <svg
          className="h-10 w-10 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="mb-3 text-3xl font-extrabold text-white">
        {t('checkout.successTitle')}
      </h1>
      <p className="mb-8 max-w-md text-slate-400">
        {t('checkout.successMessage')}
      </p>

      <Link
        to="/Cataloge/Products"
        className="rounded-full bg-cyan-400 px-8 py-3 text-sm font-bold text-slate-900 transition hover:bg-cyan-300"
      >
        {t('checkout.continueShopping')}
      </Link>
    </div>
  )
}
