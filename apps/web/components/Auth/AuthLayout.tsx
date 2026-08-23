'use client'

import React from 'react'
import LanguageSwitcher from '@components/Utils/LanguageSwitcher'
import AuthBrandingPanel from '@components/Auth/AuthBrandingPanel'
import AuthMobileHeader from '@components/Auth/AuthMobileHeader'
import { AuthFooter } from '@components/Footers/LegalFooters'

interface AuthLayoutProps {
  org: any
  welcomeText?: string
  title?: string
  subtitle?: string
  children: React.ReactNode
}

export default function AuthLayout({ org, welcomeText, title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0B1220] text-white lg:h-screen lg:flex-row">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
          backgroundSize: '80px 80px, 80px 80px',
          maskImage: 'linear-gradient(to top, black 0%, transparent 70%)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 70%)',
        }}
      />

      <div className="absolute right-4 top-4 z-50">
        <LanguageSwitcher primaryColor="#0B1220" />
      </div>

      <div className="relative z-10 lg:hidden">
        <AuthMobileHeader org={org} />
      </div>

      <div className="relative z-10 flex flex-1 flex-col overflow-auto bg-[#0B1220] lg:h-full">
        <div className="flex flex-1 flex-col">{children}</div>
        {org ? (
          <AuthFooter className="shrink-0" tone="dark" />
        ) : (
          <div className="shrink-0 px-6 pb-8 pt-6 text-center">
            <p className="text-[13px] font-medium text-white/40">
              XpeX Academy • Acesso institucional seguro.
            </p>
          </div>
        )}
      </div>

      <div className="relative z-10 hidden w-[48%] shrink-0 border-l border-white/10 lg:block">
        <AuthBrandingPanel
          org={org}
          welcomeText={welcomeText}
          title={title}
          subtitle={subtitle}
        />
      </div>
    </div>
  )
}
