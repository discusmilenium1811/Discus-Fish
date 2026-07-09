import { useEffect, useState } from 'react'
import { useTranslation } from '../i18n/LanguageContext'

// zxcvbn-ts is heavy (dictionaries), so it's dynamically imported on first use
// and the configured scorer is cached module-wide. The meter is purely advisory
// — it never blocks submission, it only nudges the user toward a stronger secret.
let scorer: ((password: string) => number) | null = null
let loadPromise: Promise<void> | null = null

async function ensureScorer(): Promise<void> {
  if (scorer) return
  if (!loadPromise) {
    loadPromise = (async () => {
      const [core, common, en] = await Promise.all([
        import('@zxcvbn-ts/core'),
        import('@zxcvbn-ts/language-common'),
        import('@zxcvbn-ts/language-en'),
      ])
      const factory = new core.ZxcvbnFactory({
        dictionary: { ...common.dictionary, ...en.dictionary },
        graphs: common.adjacencyGraphs,
        translations: en.translations,
      })
      scorer = (password: string) => factory.check(password).score
    })()
  }
  await loadPromise
}

// Tailwind classes per zxcvbn score (0 = weakest … 4 = strongest).
const BAR_COLORS = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-400',
  'bg-lime-400',
  'bg-emerald-400',
]
const LABEL_COLORS = [
  'text-rose-300',
  'text-orange-300',
  'text-amber-300',
  'text-lime-300',
  'text-emerald-300',
]

interface PasswordStrengthProps {
  password: string
  /** Minimum length required for this account type; used for the length hint. */
  minLength: number
}

export function PasswordStrength({ password, minLength }: PasswordStrengthProps) {
  const { t } = useTranslation()
  const [score, setScore] = useState(0)

  useEffect(() => {
    // Nothing to score while empty; the component renders null in that case, so
    // there's no stale bar to clear (and no synchronous setState in the effect).
    if (!password) return
    let active = true
    ensureScorer().then(() => {
      if (active && scorer) setScore(scorer(password))
    })
    return () => {
      active = false
    }
  }, [password])

  if (!password) return null

  const tooShort = password.length < minLength
  // A password below the minimum length can never look "strong" — cap the bar so
  // the visual matches the fact that it will be rejected on submit.
  const effectiveScore = tooShort ? Math.min(score, 1) : score
  const filled = Math.max(1, effectiveScore + 1) // 1..5 segments

  const strengthLabel = t(`auth.pwStrength${effectiveScore}` as 'auth.pwStrength0')

  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < filled ? BAR_COLORS[effectiveScore] : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <p
        className={`mt-1.5 pl-1 text-xs ${
          tooShort ? 'text-slate-400' : LABEL_COLORS[effectiveScore]
        }`}
      >
        {tooShort
          ? t('auth.pwMinLength').replace('{n}', String(minLength))
          : `${t('auth.pwStrengthLabel')}: ${strengthLabel}`}
      </p>
    </div>
  )
}
