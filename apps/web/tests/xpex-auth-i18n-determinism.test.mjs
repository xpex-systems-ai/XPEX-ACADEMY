import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolvePreferredLocale } from '../lib/localeResolution.ts'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('XpeX authentication locale determinism', () => {
  test('SSR and the first browser render are pinned to the same bundled locale', () => {
    const i18n = read('lib/i18n.ts')
    const provider = read('components/Contexts/I18nContext.tsx')
    const root = read('app/layout.tsx')

    expect(read('lib/localeResolution.ts')).toContain("INITIAL_LOCALE = 'pt'")
    expect(i18n).toContain('lng: INITIAL_LOCALE')
    expect(i18n).not.toContain('LanguageDetector')
    expect(provider).toContain('beginClientLocaleReconciliation()')
    expect(root).not.toContain('suppressHydrationWarning')
  })

  test('reconciles persisted, cookie, organization and browser locales deterministically', () => {
    expect(resolvePreferredLocale({})).toBe('pt')
    expect(resolvePreferredLocale({ cookie: 'pt-BR' })).toBe('pt')
    expect(resolvePreferredLocale({ persisted: 'pt', cookie: 'en' })).toBe('pt')
    expect(resolvePreferredLocale({ persisted: 'en', organization: 'pt' })).toBe('en')
    expect(resolvePreferredLocale({ browser: 'pt-BR' })).toBe('pt')
    expect(resolvePreferredLocale({ organization: 'pt', browser: 'en-US' })).toBe('pt')
    expect(resolvePreferredLocale({ persisted: 'invalid', cookie: 'invalid' })).toBe('pt')
  })

  test('loads a locale before changing the visible language and centralizes org sync', () => {
    const i18n = read('lib/i18n.ts')
    const orgSync = read('components/Contexts/OrgLanguageSync.tsx')
    const switcher = read('components/Utils/LanguageSwitcher.tsx')

    expect(i18n).toContain('const code = await loadLocale(locale)')
    expect(i18n).toContain("localStorage.setItem(USER_PICKED_KEY, '1')")
    expect(i18n).toContain('reconciliationVersion')
    expect(orgSync).toContain('setOrganizationLocale(orgDefault)')
    expect(orgSync).not.toContain('changeLanguage(')
    expect(switcher).toContain('changeLanguage(language.code)')
  })
})

describe('XpeX login branding and auth preservation', () => {
  test('uses the mandatory dark XpeX identity without legacy promotional surfaces', () => {
    const layout = read('components/Auth/AuthLayout.tsx')
    const panel = read('components/Auth/AuthBrandingPanel.tsx')
    const mobile = read('components/Auth/AuthMobileHeader.tsx')
    const login = read('app/auth/login/login.tsx')
    const primarySurfaces = `${panel}\n${mobile}\n${login}`

    expect(layout).toContain('#0B1220')
    expect(login).toContain('#FF7A00')
    expect(login).toContain('#00D4FF')
    expect(primarySurfaces).not.toContain('/lrn.svg')
    expect(primarySurfaces).not.toContain('learnhouse.app')
    expect(primarySurfaces).not.toContain('Welcome back')
    expect(primarySurfaces).not.toContain('Default Organization')
    expect(primarySurfaces).not.toContain('utm_source=LearnHouse')
    expect(panel).toContain("name.trim().toLowerCase() !== 'default organization'")
  })

  test('keeps credentials, Google, SSO, Turnstile, forgot password and safe redirects', () => {
    const login = read('app/auth/login/login.tsx')
    expect(login).toContain("signIn('credentials'")
    expect(login).toContain("signIn('google'")
    expect(login).toContain('handleSSOLogin')
    expect(login).toContain('<TurnstileWidget')
    expect(login).toContain('href="/forgot"')
    expect(login).toContain('safeAuthReturnPath')
    expect(login).toContain('/redirect_from_auth?next=')
  })

  test('provides responsive, keyboard-focus and reduced-motion affordances', () => {
    const layout = read('components/Auth/AuthLayout.tsx')
    const login = read('app/auth/login/login.tsx')
    expect(layout).toContain('lg:flex-row')
    expect(layout).toContain('lg:hidden')
    expect(login).toContain('focus-visible:ring-2')
    expect(login).toContain('motion-reduce:transition-none')
  })
})
