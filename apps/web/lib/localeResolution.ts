export const INITIAL_LOCALE = 'pt'

export const SUPPORTED_LAZY_LOCALES = new Set([
  'fr', 'de', 'es', 'ar', 'ja', 'pt', 'ru', 'zh', 'hi', 'ko', 'it', 'tr',
  'vi', 'id', 'pl', 'uk', 'nl', 'th', 'bn', 'fa', 'sk',
])

const normalizeLocale = (locale?: string | null): string | null => {
  const code = locale?.trim().toLowerCase().split(/[-_]/)[0]
  return code && (code === 'en' || SUPPORTED_LAZY_LOCALES.has(code)) ? code : null
}

const firstSupportedLocale = (candidate?: string | readonly string[] | null): string | null => {
  const locales = Array.isArray(candidate) ? candidate : [candidate]
  for (const locale of locales) {
    const normalized = normalizeLocale(locale)
    if (normalized) return normalized
  }
  return null
}

export type LocaleCandidates = {
  userPicked?: boolean
  persisted?: string | null
  cookie?: string | null
  organization?: string | null
  browser?: string | readonly string[] | null
}

export function resolvePreferredLocale(candidates: LocaleCandidates): string {
  const explicitChoice = candidates.userPicked
    ? normalizeLocale(candidates.persisted) || normalizeLocale(candidates.cookie)
    : null

  return explicitChoice
    || normalizeLocale(candidates.organization)
    || firstSupportedLocale(candidates.browser)
    || INITIAL_LOCALE
}

export { normalizeLocale }
