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
  explicitUserChoice?: boolean
  persisted?: string | null
  cookie?: string | null
  organization?: string | null
  browser?: string | readonly string[] | null
}

export function resolvePreferredLocale(candidates: LocaleCandidates): string {
  const browserLocales: readonly (string | null | undefined)[] =
    typeof candidates.browser === 'string' || candidates.browser == null
      ? [candidates.browser]
      : candidates.browser
  const explicitLocale = candidates.explicitUserChoice
    ? normalizeLocale(candidates.persisted) || normalizeLocale(candidates.cookie)
    : null

  return explicitLocale
    || normalizeLocale(candidates.organization)
    || browserLocales.map(normalizeLocale).find(Boolean)
    || INITIAL_LOCALE
}

export { normalizeLocale }
