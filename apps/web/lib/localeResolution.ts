export const INITIAL_LOCALE = 'pt'

export const SUPPORTED_LAZY_LOCALES = new Set([
  'fr', 'de', 'es', 'ar', 'ja', 'pt', 'ru', 'zh', 'hi', 'ko', 'it', 'tr',
  'vi', 'id', 'pl', 'uk', 'nl', 'th', 'bn', 'fa', 'sk',
])

const normalizeLocale = (locale?: string | null): string | null => {
  const code = locale?.trim().toLowerCase().split(/[-_]/)[0]
  return code && (code === 'en' || SUPPORTED_LAZY_LOCALES.has(code)) ? code : null
}

export type LocaleCandidates = {
  persisted?: string | null
  cookie?: string | null
  organization?: string | null
  browser?: string | null
}

export function resolvePreferredLocale(candidates: LocaleCandidates): string {
  return normalizeLocale(candidates.persisted)
    || normalizeLocale(candidates.cookie)
    || normalizeLocale(candidates.organization)
    || normalizeLocale(candidates.browser)
    || INITIAL_LOCALE
}

export { normalizeLocale }
