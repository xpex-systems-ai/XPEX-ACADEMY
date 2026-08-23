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
    expect(i18n).toContain('initAsync: false')
    expect(i18n).not.toContain('LanguageDetector')
    expect(provider).toContain('beginClientLocaleReconciliation()')
    expect(root).not.toContain('suppressHydrationWarning')
  })

  test('reconciles persisted, cookie, organization and browser locales deterministically', () => {
    expect(resolvePreferredLocale({})).toBe('pt')
    expect(resolvePreferredLocale({ explicitUserChoice: true, persisted: 'en', organization: 'pt' })).toBe('en')
    expect(resolvePreferredLocale({ explicitUserChoice: true, cookie: 'en', organization: 'pt' })).toBe('en')
    expect(resolvePreferredLocale({ persisted: 'en', cookie: 'en', organization: 'pt' })).toBe('pt')
    expect(resolvePreferredLocale({ organization: 'en', browser: ['pt-BR'] })).toBe('en')
    expect(resolvePreferredLocale({ browser: ['ca', 'es'] })).toBe('es')
    expect(resolvePreferredLocale({ browser: ['ca', 'en-US'] })).toBe('en')
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
  test('keeps every AuthLayout consumer legible on the dark pane', () => {
    const routes = [
      'app/auth/login/login.tsx',
      'app/auth/forgot/forgot.tsx',
      'app/auth/reset/reset.tsx',
      'app/auth/signup/signup.tsx',
      'app/auth/signup/OpenSignup.tsx',
      'app/auth/signup/InviteOnlySignUp.tsx',
      'app/auth/verify-email/verify-email.tsx',
    ]

    for (const route of routes) {
      const source = read(route)
      expect(source).not.toMatch(/text-black(?:\/\d+)?/)
    }
    for (const route of routes.slice(1)) {
      const source = read(route)
      expect(source).toContain('motion-reduce:')
      expect(source).toContain('focus-visible:')
    }
  })

  test('preserves signup, recovery, verification and invitation flows', () => {
    const signup = read('app/auth/signup/signup.tsx')
    const openSignup = read('app/auth/signup/OpenSignup.tsx')
    const inviteSignup = read('app/auth/signup/InviteOnlySignUp.tsx')
    const forgot = read('app/auth/forgot/forgot.tsx')
    const reset = read('app/auth/reset/reset.tsx')
    const verify = read('app/auth/verify-email/verify-email.tsx')

    expect(`${openSignup}\n${inviteSignup}`).toContain("signIn('google'")
    expect(`${openSignup}\n${inviteSignup}`).toContain('<TurnstileWidget')
    expect(openSignup).toContain('/redirect_from_auth?next=')
    expect(inviteSignup).toContain('signUpWithInviteCode')
    expect(signup).toContain('validateInviteCode')
    expect(signup).toContain('joinOrg(')
    expect(forgot).toContain('sendResetLink')
    expect(reset).toContain('resetPassword(')
    expect(verify).toContain('hasRunRef')
    expect(verify).toContain("window.location.assign('/home')")
  })

})
