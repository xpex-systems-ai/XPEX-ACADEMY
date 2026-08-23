'use client'
// Shared legal/footer bits, ported from the platform's look.
//
// AuthFooter   — the "By continuing, you agree to … Terms of Service and
//                Privacy Policy." line shown under the auth forms.
// CopyrightFooter — the "© {year} LearnHouse, Inc." line for app surfaces
//                (the apex /home hub, the onboarding page, …).
//
// Legal pages live on the marketing/platform site, so links resolve via
// getPlatformUrl() with a sensible public fallback.
import React from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { getPlatformUrl } from '@services/config/config'

const TERMS_URL = getPlatformUrl('/terms') || 'https://www.learnhouse.io/terms'
const PRIVACY_URL = getPlatformUrl('/privacy') || 'https://www.learnhouse.io/privacy'

export function AuthFooter({ className = '', tone = 'light' }: { className?: string; tone?: 'light' | 'dark' }) {
  const { t } = useTranslation()
  const text = tone === 'dark' ? 'text-white/35' : 'text-black/30'
  const link = tone === 'dark' ? 'text-white/55 hover:text-white/80' : 'text-black/50 hover:text-black/70'
  return (
    <div className={`pb-8 pt-6 text-center px-6 ${className}`}>
      <p className={`text-[13px] font-medium ${text}`}>
        {t('auth.terms_text', { defaultValue: "By continuing, you agree to LearnHouse's" })}{' '}
        <Link
          href={TERMS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${link} transition-colors`}
        >
          {t('auth.terms_of_service', { defaultValue: 'Terms of Service' })}
        </Link>{' '}
        {t('auth.and', { defaultValue: 'and' })}{' '}
        <Link
          href={PRIVACY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${link} transition-colors`}
        >
          {t('auth.privacy_policy', { defaultValue: 'Privacy Policy' })}
        </Link>
        .
      </p>
      {tone === 'dark' && (
        <p className="mt-2 text-[11px] text-white/25">
          Versão modificada do projeto open-source LearnHouse, distribuído sob licença AGPL.
        </p>
      )}
    </div>
  )
}

export function CopyrightFooter({
  year,
  className = '',
  tone = 'light',
}: {
  year: number
  className?: string
  // `light` → dark text on light bg; `dark` → light text on dark bg.
  tone?: 'light' | 'dark'
}) {
  const { t } = useTranslation()
  const base = tone === 'dark' ? 'text-white/40' : 'text-black/35'
  const link = tone === 'dark' ? 'text-white/60 hover:text-white/80' : 'text-black/55 hover:text-black/75'
  return (
    <footer className={`w-full py-6 px-6 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-x-5 gap-y-2 text-[13px] font-medium">
        <p className={base}>
          {t('common.copyright', { defaultValue: '© {{year}} LearnHouse, Inc.', year })}
        </p>
        <nav className="flex items-center gap-x-5">
          <Link
            href={TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${link} transition-colors`}
          >
            {t('auth.terms_of_service', { defaultValue: 'Terms of Service' })}
          </Link>
          <Link
            href={PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${link} transition-colors`}
          >
            {t('auth.privacy_policy', { defaultValue: 'Privacy Policy' })}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
