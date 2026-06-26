// Bilingual EN/ES. `en` is the default; ES content falls back to EN in Payload
// (localization.fallback = true). URL routing is /[lang]/… via middleware + layout.
export const LOCALES = ['en', 'es'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

export const isLocale = (v: string | undefined | null): v is Locale =>
  typeof v === 'string' && (LOCALES as readonly string[]).includes(v)

export const resolveLocale = (v: string | undefined | null): Locale =>
  isLocale(v) ? v : DEFAULT_LOCALE
