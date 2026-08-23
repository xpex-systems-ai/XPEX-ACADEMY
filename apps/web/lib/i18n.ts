'use client'

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en.json'
import pt from '../locales/pt.json'
import {
  INITIAL_LOCALE,
  normalizeLocale,
  resolvePreferredLocale,
  type LocaleCandidates,
} from './localeResolution'
const USER_PICKED_KEY = 'i18nextLng_userPicked'
const LOCALE_STORAGE_KEY = 'i18nextLng'

const LOCALE_LOADERS: Record<string, () => Promise<{ default: any }>> = {
  fr: () => import('../locales/fr.json'), de: () => import('../locales/de.json'),
  es: () => import('../locales/es.json'), ar: () => import('../locales/ar.json'),
  ja: () => import('../locales/ja.json'), pt: () => import('../locales/pt.json'),
  ru: () => import('../locales/ru.json'), zh: () => import('../locales/zh.json'),
  hi: () => import('../locales/hi.json'), ko: () => import('../locales/ko.json'),
  it: () => import('../locales/it.json'), tr: () => import('../locales/tr.json'),
  vi: () => import('../locales/vi.json'), id: () => import('../locales/id.json'),
  pl: () => import('../locales/pl.json'), uk: () => import('../locales/uk.json'),
  nl: () => import('../locales/nl.json'), th: () => import('../locales/th.json'),
  bn: () => import('../locales/bn.json'), fa: () => import('../locales/fa.json'),
  sk: () => import('../locales/sk.json'),
}

export { resolvePreferredLocale }
export type { LocaleCandidates }

i18n.use(initReactI18next).init({
  resources: { en: { common: en }, pt: { common: pt } },
  lng: INITIAL_LOCALE,
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
  initAsync: false,
})

async function loadLocale(locale: string) {
  const code = normalizeLocale(locale) || INITIAL_LOCALE
  if (code === 'en' || code === INITIAL_LOCALE || i18n.hasResourceBundle(code, 'common')) return code
  try {
    const mod = await LOCALE_LOADERS[code]()
    i18n.addResourceBundle(code, 'common', mod.default, true, true)
    return code
  } catch (error) {
    console.warn(`Failed to load locale: ${code}`, error)
    return i18n.language.split('-')[0]
  }
}

async function applyLanguage(locale: string) {
  const code = await loadLocale(locale)
  if (i18n.language.split('-')[0] !== code) await i18n.changeLanguage(code)
}

let hydrationComplete = false
let organizationLocale: string | undefined
let reconciliationTimer: ReturnType<typeof setTimeout> | undefined
let reconciliationVersion = 0

const readCookieLocale = () => {
  const match = document.cookie.match(/(?:^|;\s*)i18next=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function scheduleReconciliation() {
  if (!hydrationComplete || typeof window === 'undefined') return
  if (reconciliationTimer) clearTimeout(reconciliationTimer)
  const scheduledVersion = ++reconciliationVersion
  reconciliationTimer = setTimeout(async () => {
    let persisted: string | null = null
    let explicitUserChoice = false
    try {
      persisted = localStorage.getItem(LOCALE_STORAGE_KEY)
      explicitUserChoice = localStorage.getItem(USER_PICKED_KEY) === '1'
    } catch { /* storage unavailable */ }
    const locale = resolvePreferredLocale({
      explicitUserChoice,
      persisted,
      cookie: readCookieLocale(),
      organization: organizationLocale,
      browser: navigator.languages?.length ? navigator.languages : navigator.language,
    })
    await loadLocale(locale)
    if (scheduledVersion === reconciliationVersion) await applyLanguage(locale)
  }, 0)
}

/** Called from an effect: detection cannot run until the initial tree is hydrated. */
export function beginClientLocaleReconciliation() {
  hydrationComplete = true
  scheduleReconciliation()
}

/** Registers the org preference with the same coordinator, avoiding competing effects. */
export function setOrganizationLocale(locale?: string | null) {
  organizationLocale = normalizeLocale(locale) || undefined
  scheduleReconciliation()
}

/** Manual selection wins on subsequent visits and preempts pending automatic changes. */
export async function changeLanguage(locale: string) {
  const code = normalizeLocale(locale) || INITIAL_LOCALE
  reconciliationVersion++
  if (reconciliationTimer) clearTimeout(reconciliationTimer)
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(USER_PICKED_KEY, '1')
      localStorage.setItem(LOCALE_STORAGE_KEY, code)
    } catch { /* storage unavailable */ }
    document.cookie = `i18next=${encodeURIComponent(code)}; Path=/; SameSite=Lax; Max-Age=31536000`
  }
  await applyLanguage(code)
}

export default i18n
