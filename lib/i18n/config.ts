// Bilingual EN/ES. `en` is the default; ES content falls back to EN in Payload
// (localization.fallback = true). URL routing is /[lang]/… via middleware + layout.
export const LOCALES = ['en', 'es'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

export const isLocale = (v: string | undefined | null): v is Locale =>
  typeof v === 'string' && (LOCALES as readonly string[]).includes(v)

export const resolveLocale = (v: string | undefined | null): Locale =>
  isLocale(v) ? v : DEFAULT_LOCALE

// Persists the visitor's language choice so a locale-less URL redirects back to it.
export const LOCALE_COOKIE = 'NEXT_LOCALE'

// Pick a locale for a locale-less request: a prior cookie choice wins, else the
// browser's Accept-Language, else the default.
export function negotiateLocale(
  acceptLanguage?: string | null,
  cookieValue?: string | null,
): Locale {
  if (isLocale(cookieValue)) return cookieValue
  const first = acceptLanguage?.split(',')[0]?.trim().slice(0, 2).toLowerCase()
  if (isLocale(first)) return first
  return DEFAULT_LOCALE
}
