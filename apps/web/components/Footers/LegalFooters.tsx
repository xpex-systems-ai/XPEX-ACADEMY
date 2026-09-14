'use client'
// Shared legal/footer bits for XpeX-facing surfaces.
// Legal links stay configurable through getPlatformUrl(); open-source attribution
// points to the corresponding XpeX repository/license without exposing upstream
// product branding in the learner/professor experience.
import React from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { getPlatformUrl } from '@services/config/config'

const TERMS_URL = getPlatformUrl('/terms') || 'https://www.learnhouse.io/terms'
const PRIVACY_URL = getPlatformUrl('/privacy') || 'https://www.learnhouse.io/privacy'
const LICENSE_URL = 'https://github.com/xpex-systems-ai/XPEX-ACADEMY/blob/dev/LICENSE'
const SOURCE_URL = 'https://github.com/xpex-systems-ai/XPEX-ACADEMY'

export function AuthFooter({ className = '', tone = 'light' }: { className?: string; tone?: 'light' | 'dark' }) {
  const { t, i18n } = useTranslation()
  const text = tone === 'dark' ? 'text-white/55' : 'text-black/30'
  const link = tone === 'dark' ? 'text-white/55 hover:text-white/80' : 'text-black/50 hover:text-black/70'
  const isPortuguese = (i18n.resolvedLanguage || i18n.language || '').toLowerCase().startsWith('pt')
  const termsLead = isPortuguese ? 'Ao continuar, você concorda com os' : 'By continuing, you agree to the'
  const sourceLead = isPortuguese
    ? 'XpeX Academy utiliza componentes de software livre sob licença'
    : 'XpeX Academy uses open-source components under the'
  const sourceTail = isPortuguese ? 'Código-fonte correspondente' : 'Corresponding source code'

  return (
    <div className={`pb-8 pt-6 text-center px-6 ${className}`}>
      <p className={`text-[13px] font-medium ${text}`}>
        {termsLead}{' '}
        <Link
          href={TERMS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${link} transition-colors`}
        >
          {t('auth.terms_of_service', { defaultValue: 'Terms of Service' })}
        </Link>{' '}
        {t('auth.and', { defaultValue: isPortuguese ? 'e' : 'and' })}{' '}
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
        <p className="mt-2 text-[11px] text-white/55">
          {sourceLead}{' '}
          <a href={LICENSE_URL} target="_blank" rel="noopener noreferrer" className={`${link} underline underline-offset-2`}>
            AGPL-3.0
          </a>
          {' · '}
          <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className={`${link} underline underline-offset-2`}>
            {sourceTail}
          </a>
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
        <p className={base}>© {year} XpeX Academy</p>
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
