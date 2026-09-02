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
    expect(i18n).not.toContain('initImmediate')
    expect(i18n).not.toContain('LanguageDetector')
    expect(provider).toContain('beginClientLocaleReconciliation()')
    expect(root).not.toContain('suppressHydrationWarning')
  })

  test('reconciles persisted, cookie, organization and browser locales deterministically', () => {
    expect(resolvePreferredLocale({})).toBe('pt')
    expect(resolvePreferredLocale({ cookie: 'en' })).toBe('pt')
    expect(resolvePreferredLocale({ persisted: 'en', organization: 'pt' })).toBe('pt')
    expect(resolvePreferredLocale({ userPicked: true, persisted: 'en', organization: 'pt' })).toBe('en')
    expect(resolvePreferredLocale({ userPicked: true, cookie: 'es', organization: 'pt' })).toBe('es')
    expect(resolvePreferredLocale({ browser: 'pt-BR' })).toBe('pt')
    expect(resolvePreferredLocale({ browser: ['ca', 'es'] })).toBe('es')
    expect(resolvePreferredLocale({ organization: 'pt', browser: ['ca', 'en-US'] })).toBe('pt')
    expect(resolvePreferredLocale({ userPicked: true, persisted: 'invalid', cookie: 'invalid' })).toBe('pt')
  })

  test('loads a locale before changing the visible language and centralizes org sync', () => {
    const i18n = read('lib/i18n.ts')
    const orgSync = read('components/Contexts/OrgLanguageSync.tsx')
    const switcher = read('components/Utils/LanguageSwitcher.tsx')

    expect(i18n).toContain('const code = await loadLocale(locale)')
    expect(i18n).toContain("localStorage.setItem(USER_PICKED_KEY, '1')")
    expect(i18n).toContain('userPicked ||= readCookieValue(USER_PICKED_KEY)')
    expect(i18n).toContain('browser: browserLanguages')
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
    expect(panel).toContain('AuthBrandingPanel({ org, welcomeText, title, subtitle }')
    expect(panel).toContain("{configuredWelcome || welcomeText || 'XpeX Academy'}")
    expect(panel).toContain('branding.welcome_message')
    expect(panel).toContain("branding.text_color === 'dark'")
    expect(panel).toContain("isDarkText ? 'text-slate-950' : 'text-white'")
    expect(panel).toContain('branding.unsplash_photographer_name')
    expect(panel).toContain('branding.unsplash_photographer_url')
    expect(panel).toContain('branding.unsplash_photo_url')
    expect(panel).toContain('utm_source=XpeX_Academy')
    expect(panel).toContain("hasCustomBackground ? 'bg-[#0B1220]/90'")
    expect(panel.indexOf('bg-[radial-gradient')).toBeLessThan(panel.indexOf("hasCustomBackground ? 'bg-[#0B1220]/90'"))
    expect(panel).toContain('const unsplashPhotographerUrl')
    expect(panel).toContain('const unsplashPhotoUrl')
    expect(panel).toContain('href={unsplashPhotoUrl}')
    expect(panel).toContain("{title || 'XpeX Academy'}")
    expect(panel).toContain('{subtitle}')
    expect(panel).not.toContain('Portal educacional')
    expect(panel).not.toContain('Aprenda, crie e evolua')
    expect(panel).not.toContain('Ambiente seguro de aprendizagem')
    expect(layout).toContain("{subtitle || title || 'XpeX Academy'}")
    expect(layout).not.toContain('Acesso institucional seguro')
    expect(login).toContain("t('auth.login_to')")
    expect(login).toContain("t('auth.enter_credentials')")
    expect(login).not.toContain('xpex_access_title')
    expect(login).not.toContain('xpex_access_subtitle')
    expect(mobile).not.toContain('Identidade da organização')
    expect(mobile).toContain("org.name")
    expect(mobile).toContain('{organizationName}')
    expect(mobile).toContain("'relative z-10 mt-2 truncate pr-20 text-xs font-semibold'")
    expect(mobile).toContain('branding.background_type')
    expect(mobile).toContain('branding.background_image')
    expect(mobile).toContain('getOrgAuthBackgroundMediaDirectory')
    expect(mobile).toContain("branding.text_color === 'dark'")
    expect(mobile).toContain("hasCustomBackground ? 'bg-[#0B1220]/90'")
    expect(mobile).toContain('branding.unsplash_photographer_name')
    expect(mobile).toContain('branding.unsplash_photo_url')
    expect(mobile).toContain('href={unsplashPhotoUrl}')
    const legalFooter = read('components/Footers/LegalFooters.tsx')
    expect(legalFooter).toContain("t('auth.xpex_agpl_notice'")
    expect(legalFooter).not.toContain('Versão modificada do projeto open-source LearnHouse')
    for (const locale of ["en","pt","fr","de","es","ar","ja","ru","zh","hi","ko","it","tr","vi","id","pl","uk","nl","th","bn","fa","sk"]) {
      const messages = JSON.parse(read(`locales/${locale}.json`))
      expect(messages.auth.xpex_agpl_notice).toBeTruthy()
      expect(messages.auth.xpex_access_title).toBeUndefined()
      expect(messages.auth.xpex_access_subtitle).toBeUndefined()
      expect(messages.auth.image_title_login).toContain('XpeX Academy')
      expect(messages.auth.image_title_signup).toContain('XpeX Academy')
      expect(messages.auth.image_title_login).not.toContain('LearnHouse')
      expect(messages.auth.image_title_signup).not.toContain('LearnHouse')
    }
  })

  test('keeps every shared AuthLayout consumer legible on the dark pane', () => {
    const consumers = [
      'app/auth/forgot/forgot.tsx',
      'app/auth/reset/reset.tsx',
      'app/auth/signup/signup.tsx',
      'app/auth/signup/OpenSignup.tsx',
      'app/auth/signup/InviteOnlySignUp.tsx',
      'app/auth/verify-email/verify-email.tsx',
    ].map(read)
    const darkSurfaces = [read('app/auth/login/login.tsx'), read('components/Auth/AuthLayout.tsx'), read('components/Auth/AuthBrandingPanel.tsx'), ...consumers]
    for (const surface of darkSurfaces) {
      for (const lowContrastToken of ['text-white/25', 'text-white/30', 'text-white/35', 'text-white/40', 'text-white/45']) {
        expect(surface).not.toContain(lowContrastToken)
      }
    }
    for (const consumer of consumers) {
      expect(consumer).not.toContain('text-black')
      expect(consumer).not.toContain('bg-neutral-50')
      expect(consumer).not.toContain('border-neutral-200')
      expect(consumer).toContain('text-white')
    }
  })

  test('keeps credentials, Google, SSO, Turnstile, forgot password and safe redirects', () => {
    const login = read('app/auth/login/login.tsx')
    expect(login).toContain("signIn('credentials'")
    expect(login).toContain("signIn('google'")
    expect(login).toContain('handleSSOLogin')
    expect(login).toContain('<TurnstileWidget')
    expect(login).toContain('href="/forgot"')
    expect(login).toContain('safeAuthReturnPath')
    expect(login).toContain('window.location.href = callbackUrl')
    expect(login).not.toContain('/redirect_from_auth?next=')
  })

  test('provides responsive, keyboard-focus and reduced-motion affordances', () => {
    const layout = read('components/Auth/AuthLayout.tsx')
    const login = read('app/auth/login/login.tsx')
    expect(layout).toContain('lg:flex-row')
    expect(layout).toContain('lg:hidden')
    expect(layout).toContain('<LanguageSwitcher primaryColor="#0B1220" />')
    expect(layout).toContain('border-white/20 bg-[#0B1220] shadow-lg')
    expect(read('components/Footers/LegalFooters.tsx')).toContain("tone === 'dark' ? 'text-white/55'")
    expect(read('components/Auth/AuthMobileHeader.tsx')).toContain('items-center gap-3 pr-20')
    const passwordStrength = read('components/Auth/PasswordStrengthIndicator.tsx')
    expect(passwordStrength).toContain("tone?: 'light' | 'dark'")
    expect(passwordStrength).toContain("isDark ? 'text-white/70'")
    expect(passwordStrength).toContain("isDark ? 'text-red-400'")
    expect(passwordStrength).toContain('validator: (_password: string) => boolean')
    expect(passwordStrength).not.toContain('\\[')
    expect(read('app/auth/reset/reset.tsx')).toContain('<PasswordStrengthIndicator tone="dark"')
    expect(read('app/auth/signup/OpenSignup.tsx')).toContain('<PasswordStrengthIndicator tone="dark"')
    expect(read('app/auth/signup/InviteOnlySignUp.tsx')).toContain('<PasswordStrengthIndicator tone="dark"')
    expect(login).toContain('focus-visible:ring-2')
    expect(login).toContain('motion-reduce:transition-none')
  })
})
