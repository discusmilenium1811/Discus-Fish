import { useEffect, useRef, useState } from 'react'
import type { CartItem } from '../hooks/useCart'
import { formatPrice } from '../lib/format'
import {
  createCheckout,
  validateCoupon,
  type CheckoutCustomer,
} from '../lib/api'
import { computeBreakdown } from '../lib/pricing'
import { useAuth } from '../auth/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'
import {
  DEFAULT_FREE_SHIPPING_THRESHOLDS,
  fetchFreeShippingThresholds,
} from '../lib/shipping'

const ITEM_FALLBACK = '/pictures/discus-closeup.webp'

const inputCls =
  'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/60 focus:bg-white/10'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
  items: CartItem[]
  totalCents: number
  onSetQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  onClear: () => void
}

type Step = 'cart' | 'details'

interface AppliedCoupon {
  code: string
  discountCents: number
}

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phone: '',
  country: '',
  state: '',
  city: '',
  street: '',
  building: '',
  floor: '',
  apartment: '',
  postalCode: '',
}

export function CartDrawer({
  open,
  onClose,
  items,
  totalCents: subtotalCents,
  onSetQuantity,
  onRemove,
  onClear,
}: CartDrawerProps) {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const [step, setStep] = useState<Step>('cart')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [freeThresholds, setFreeThresholds] = useState(DEFAULT_FREE_SHIPPING_THRESHOLDS)

  useEffect(() => {
    if (!open) return
    let active = true
    const refresh = () => {
      fetchFreeShippingThresholds()
        .then((thresholds) => {
          if (active) setFreeThresholds(thresholds)
        })
        .catch(() => {
          /* keep safe defaults while shipping settings are unavailable */
        })
    }
    refresh()
    const timer = window.setInterval(refresh, 30_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [open])

  // Delivery details form.
  const [form, setForm] = useState(EMPTY_FORM)
  const upd =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  // Coupon.
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  const [couponMsg, setCouponMsg] = useState<string | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const couponRef = useRef<AppliedCoupon | null>(null)
  useEffect(() => {
    couponRef.current = coupon
  }, [coupon])

  // Re-validate an applied coupon when the cart subtotal changes so the shown
  // discount stays accurate (the server re-checks authoritatively at pay time).
  useEffect(() => {
    const applied = couponRef.current
    if (!applied) return
    let active = true
    validateCoupon(applied.code, subtotalCents)
      .then((res) => {
        if (!active) return
        if (res.valid) {
          setCoupon((prev) =>
            prev ? { ...prev, discountCents: res.discountCents } : prev,
          )
        } else {
          setCoupon(null)
          setCouponMsg(t('cart.couponCleared'))
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [subtotalCents, t])

  function handleClose() {
    setStep('cart')
    onClose()
  }

  const breakdown = computeBreakdown(subtotalCents, coupon?.discountCents ?? 0)

  async function applyCoupon() {
    const code = couponCode.trim()
    if (!code) return
    setCouponLoading(true)
    setCouponMsg(null)
    try {
      const res = await validateCoupon(code, subtotalCents)
      if (res.valid) {
        setCoupon({ code: res.code ?? code.toUpperCase(), discountCents: res.discountCents })
        setCouponCode('')
        setCouponMsg(null)
      } else {
        setCoupon(null)
        setCouponMsg(res.message ?? t('cart.couponInvalid'))
      }
    } catch {
      setCoupon(null)
      setCouponMsg(t('cart.couponInvalid'))
    } finally {
      setCouponLoading(false)
    }
  }

  function removeCoupon() {
    setCoupon(null)
    setCouponMsg(null)
  }

  async function handlePay() {
    // Required fields: name, full address, and at least one contact method.
    const missingRequired =
      !form.fullName.trim() ||
      !form.country.trim() ||
      !form.city.trim() ||
      !form.street.trim() ||
      !form.postalCode.trim()
    if (missingRequired) {
      setError(t('cart.requiredError'))
      return
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setError(t('cart.contactRequired'))
      return
    }

    setLoading(true)
    setError(null)
    try {
      const customer: CheckoutCustomer = {
        contact: {
          fullName: form.fullName.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
        },
        shipping: {
          country: form.country.trim(),
          state: form.state.trim() || undefined,
          city: form.city.trim(),
          street: form.street.trim(),
          building: form.building.trim() || undefined,
          floor: form.floor.trim() || undefined,
          apartment: form.apartment.trim() || undefined,
          postalCode: form.postalCode.trim(),
        },
        couponCode: coupon?.code,
      }

      // Attach the logged-in customer, plus company billing for business accounts.
      if (user) {
        customer.userId = user.id
        customer.email = user.email ?? (form.email.trim() || undefined)
        if (profile?.account_type === 'business' && profile.company_name) {
          customer.billing = {
            company: profile.company_name,
            vatNumber: profile.vat_number ?? '',
            registrationNumber: profile.registration_number ?? undefined,
            contactName: profile.contact_name ?? undefined,
            phone: profile.phone ?? undefined,
            email: profile.billing_email ?? profile.email ?? undefined,
            address1: profile.address_line1 ?? undefined,
            address2: profile.address_line2 ?? undefined,
            city: profile.city ?? undefined,
            state: profile.state ?? undefined,
            postalCode: profile.postal_code ?? undefined,
            country: profile.country ?? undefined,
          }
        }
      } else {
        customer.email = form.email.trim() || undefined
      }

      const { url } = await createCheckout(
        items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        customer,
      )
      window.location.href = url
    } catch {
      setError(t('cart.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 z-50 bg-slate-950/70 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-slate-900 text-slate-100 shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label={t('cart.title')}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            {step === 'details' && (
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label={t('cart.back')}
              >
                ←
              </button>
            )}
            <h2 className="text-lg font-bold text-white">
              {step === 'details' ? t('cart.deliveryDetails') : t('cart.title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label={t('cart.close')}
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
            <span className="text-5xl">🛒</span>
            <p className="font-semibold text-slate-200">{t('cart.empty')}</p>
            <p className="text-sm text-slate-400">{t('cart.emptyHint')}</p>
          </div>
        ) : step === 'cart' ? (
          /* ---------------- STEP 1: cart items ---------------- */
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <img
                  src={item.product.imageUrl ?? ITEM_FALLBACK}
                  alt={item.product.name}
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      {item.product.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => onRemove(item.product.id)}
                      className="text-xs text-slate-400 hover:text-rose-400"
                      aria-label={`${t('cart.remove')} ${item.product.name}`}
                    >
                      {t('cart.remove')}
                    </button>
                  </div>
                  <p className="text-sm text-slate-400">
                    {formatPrice(item.product.priceCents, item.product.currency)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onSetQuantity(item.product.id, item.quantity - 1)
                      }
                      className="grid h-7 w-7 place-items-center rounded-full border border-white/20 text-slate-200 transition hover:bg-white/10"
                      aria-label={t('cart.decrease')}
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onSetQuantity(item.product.id, item.quantity + 1)
                      }
                      className="grid h-7 w-7 place-items-center rounded-full border border-white/20 text-slate-200 transition hover:bg-white/10"
                      aria-label={t('cart.increase')}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={onClear}
              className="text-xs font-medium text-slate-400 hover:text-rose-400"
            >
              {t('cart.clear')}
            </button>
          </div>
        ) : (
          /* ---------------- STEP 2: delivery details ---------------- */
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {/* Contact */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-white">{t('cart.contactInfo')}</h3>
              <FieldInput
                label={`${t('cart.fullName')} *`}
                value={form.fullName}
                onChange={upd('fullName')}
                autoComplete="name"
              />
              <div className="grid grid-cols-2 gap-3">
                <FieldInput
                  label={t('cart.email')}
                  type="email"
                  value={form.email}
                  onChange={upd('email')}
                  autoComplete="email"
                />
                <FieldInput
                  label={t('cart.phone')}
                  type="tel"
                  value={form.phone}
                  onChange={upd('phone')}
                  autoComplete="tel"
                />
              </div>
              <p className="text-xs text-slate-500">{t('cart.contactHint')}</p>
            </section>

            {/* Delivery address */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-white">{t('cart.shippingAddress')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <FieldInput
                  label={`${t('cart.country')} *`}
                  value={form.country}
                  onChange={upd('country')}
                  autoComplete="country-name"
                />
                <FieldInput
                  label={t('cart.state')}
                  value={form.state}
                  onChange={upd('state')}
                  autoComplete="address-level1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldInput
                  label={`${t('cart.city')} *`}
                  value={form.city}
                  onChange={upd('city')}
                  autoComplete="address-level2"
                />
                <FieldInput
                  label={`${t('cart.postalCode')} *`}
                  value={form.postalCode}
                  onChange={upd('postalCode')}
                  autoComplete="postal-code"
                />
              </div>
              <FieldInput
                label={`${t('cart.street')} *`}
                value={form.street}
                onChange={upd('street')}
                autoComplete="address-line1"
              />
              <div className="grid grid-cols-3 gap-3">
                <FieldInput
                  label={t('cart.building')}
                  value={form.building}
                  onChange={upd('building')}
                />
                <FieldInput
                  label={t('cart.floor')}
                  value={form.floor}
                  onChange={upd('floor')}
                />
                <FieldInput
                  label={t('cart.apartment')}
                  value={form.apartment}
                  onChange={upd('apartment')}
                />
              </div>
            </section>

            {/* Coupon */}
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-white">{t('cart.coupon')}</h3>
              {coupon ? (
                <div className="flex items-center justify-between rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2">
                  <span className="text-sm font-semibold text-emerald-300">
                    {coupon.code} · −{formatPrice(coupon.discountCents, 'eur')}
                  </span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-xs text-slate-300 hover:text-rose-300"
                  >
                    {t('cart.remove')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    className={inputCls}
                    placeholder={t('cart.couponPlaceholder')}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        applyCoupon()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="shrink-0 rounded-lg border border-white/20 px-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                  >
                    {couponLoading ? '…' : t('cart.couponApply')}
                  </button>
                </div>
              )}
              {couponMsg && <p className="text-xs text-rose-300">{couponMsg}</p>}
            </section>

            {/* Order summary */}
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-3 text-sm font-bold text-white">{t('cart.orderSummary')}</h3>
              <div className="space-y-1.5 text-sm">
                <Row
                  label={t('cart.subtotal')}
                  value={formatPrice(breakdown.subtotalCents, 'eur')}
                />
                <Row
                  label={t('cart.vatIncluded')}
                  value={formatPrice(breakdown.vatCents, 'eur')}
                />
                {breakdown.discountCents > 0 && (
                  <Row
                    label={`${t('cart.discount')}${coupon ? ` (${coupon.code})` : ''}`}
                    value={`−${formatPrice(breakdown.discountCents, 'eur')}`}
                    tone="discount"
                  />
                )}
                <Row
                  label={t('cart.shipping')}
                  value={
                    breakdown.shippingCents === 0
                      ? t('cart.shippingFree')
                      : formatPrice(breakdown.shippingCents, 'eur')
                  }
                  tone={breakdown.shippingCents === 0 ? 'free' : undefined}
                />
                <div className="my-2 border-t border-white/10" />
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white">{t('cart.total')}</span>
                  <span className="text-xl font-extrabold text-white">
                    {formatPrice(breakdown.totalCents, 'eur')}
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ---------------- STEP 1 footer: summary + checkout ---------------- */}
        {items.length > 0 && step === 'cart' && (
          <div className="border-t border-white/10 px-5 py-4">
            {/* Shipping progress banner */}
            {(() => {
              const cyprusThreshold = Math.min(freeThresholds.cyprusCents, freeThresholds.euCents)
              const euThreshold = Math.max(freeThresholds.cyprusCents, freeThresholds.euCents)
              const cyprusUnlocked = subtotalCents >= cyprusThreshold
              const euUnlocked = subtotalCents >= euThreshold
              const progressPct = Math.min(
                100,
                Math.round((subtotalCents / euThreshold) * 100),
              )
              const cyprusMarkerPct = Math.min(100, (cyprusThreshold / euThreshold) * 100)
              const remainingToCyprus = Math.max(0, cyprusThreshold - subtotalCents)
              const remainingToEu = Math.max(0, euThreshold - subtotalCents)

              return (
                <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <p className={`mb-3 text-center text-xs font-semibold ${cyprusUnlocked ? 'text-emerald-300' : 'text-slate-300'}`}>
                    {euUnlocked
                      ? t('cart.cyprusEuUnlocked')
                      : cyprusUnlocked
                        ? t('cart.cyprusUnlockedEuRemaining').replace(
                            '{amount}',
                            formatPrice(remainingToEu, 'eur'),
                          )
                        : t('cart.cyprusShippingProgress').replace(
                            '{amount}',
                            formatPrice(remainingToCyprus, 'eur'),
                          )}
                  </p>

                  <div className="relative mb-1.5 h-4 text-[0.6rem] font-extrabold uppercase tracking-wide">
                    <span
                      className={`absolute -translate-x-1/2 ${cyprusUnlocked ? 'text-emerald-300' : 'text-slate-400'}`}
                      style={{ left: `${cyprusMarkerPct}%` }}
                    >
                      CY {formatPrice(cyprusThreshold, 'eur')}
                    </span>
                    <span className={`absolute right-0 ${euUnlocked ? 'text-emerald-300' : 'text-slate-400'}`}>
                      EU {formatPrice(euThreshold, 'eur')}
                    </span>
                  </div>
                  <div className="relative h-2.5 w-full rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                    <span
                      className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${cyprusUnlocked ? 'border-emerald-200 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' : 'border-slate-500 bg-slate-800'}`}
                      style={{ left: `${cyprusMarkerPct}%` }}
                      aria-hidden="true"
                    />
                    <span className={`absolute right-0 top-1/2 h-4 w-4 translate-x-0 -translate-y-1/2 rounded-full border-2 ${euUnlocked ? 'border-emerald-200 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' : 'border-slate-500 bg-slate-800'}`} aria-hidden="true" />
                  </div>
                </div>
              )
            })()}

            {/* Subtotal + shipping rows */}
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-slate-400">{t('cart.subtotal')}</span>
              <span className="text-sm font-semibold text-white">
                {formatPrice(breakdown.subtotalCents, 'eur')}
              </span>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-400">{t('cart.shipping')}</span>
              {breakdown.shippingCents === 0 ? (
                <span className="text-sm font-bold text-emerald-400">
                  {t('cart.shippingFree')}
                </span>
              ) : (
                <span className="text-sm font-semibold text-white">
                  {formatPrice(breakdown.shippingCents, 'eur')}
                </span>
              )}
            </div>
            <div className="mb-4 flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-sm font-bold text-white">{t('cart.total')}</span>
              <span className="text-xl font-extrabold text-white">
                {formatPrice(breakdown.totalCents, 'eur')}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setError(null)
                setStep('details')
              }}
              className="w-full rounded-full bg-cyan-400 py-3 text-sm font-bold text-slate-900 transition hover:bg-cyan-300"
            >
              {t('cart.checkout')}
            </button>
          </div>
        )}

        {/* ---------------- STEP 2 footer: pay now ---------------- */}
        {items.length > 0 && step === 'details' && (
          <div className="border-t border-white/10 px-5 py-4">
            {error && (
              <p className="mb-3 rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300">
                {error}
              </p>
            )}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold text-white">{t('cart.total')}</span>
              <span className="text-xl font-extrabold text-white">
                {formatPrice(breakdown.totalCents, 'eur')}
              </span>
            </div>
            <button
              type="button"
              onClick={handlePay}
              disabled={loading}
              className="w-full rounded-full bg-cyan-400 py-3 text-sm font-bold text-slate-900 transition hover:bg-cyan-300 disabled:opacity-60"
            >
              {loading ? t('cart.redirecting') : t('cart.payNow')}
            </button>
            <p className="mt-2 text-center text-xs text-slate-500">
              {t('cart.securePayment')}
            </p>
          </div>
        )}
      </aside>
    </>
  )
}

/** Labelled text input used across the delivery form. */
function FieldInput({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      <input className={inputCls} {...props} />
    </label>
  )
}

/** One line in the order summary. */
function Row({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'discount' | 'free'
}) {
  const valueCls =
    tone === 'discount'
      ? 'text-emerald-300'
      : tone === 'free'
        ? 'font-bold text-emerald-400'
        : 'text-white'
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={`font-semibold ${valueCls}`}>{value}</span>
    </div>
  )
}
