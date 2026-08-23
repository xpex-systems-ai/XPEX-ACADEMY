'use client'

import React from 'react'
import { getOrgLogoMediaDirectory, getOrgAuthBackgroundMediaDirectory } from '@services/media/media'

interface AuthBrandingPanelProps {
  org: any
  welcomeText?: string
  title?: string
  subtitle?: string
}

const visibleOrganizationName = (name?: string) =>
  name && name.trim().toLowerCase() !== 'default organization' ? name : null

export default function AuthBrandingPanel({ org, welcomeText, title, subtitle }: AuthBrandingPanelProps) {
  const branding = org?.config?.config?.customization?.auth_branding
    || org?.config?.config?.general?.auth_branding
    || {}
  const hasCustomBackground = Boolean(branding.background_image && branding.background_type !== 'gradient')
  const backgroundImage = branding.background_type === 'custom'
    ? getOrgAuthBackgroundMediaDirectory(org?.org_uuid, branding.background_image)
    : branding.background_image
  const organizationName = visibleOrganizationName(org?.name)

  return (
    <aside className="relative h-full overflow-hidden bg-[#0B1220] text-white" aria-label="XpeX Academy">
      {hasCustomBackground && (
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${backgroundImage})` }} />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,122,0,.28),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(0,212,255,.22),transparent_30%)]" />
      <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 flex h-full flex-col p-10 xl:p-16">
        <div className="inline-flex w-fit items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FF7A00] text-lg font-black shadow-[0_0_36px_rgba(255,122,0,.32)]">XP</span>
          <span>
            <strong className="block tracking-[.2em]">XpeX</strong>
            <small className="text-[10px] font-bold uppercase tracking-[.24em] text-white/55">Academy</small>
          </span>
        </div>

        <div className="my-auto max-w-lg">
          {org?.logo_image && (
            <img
              src={getOrgLogoMediaDirectory(org.org_uuid, org.logo_image)}
              alt={organizationName || 'XpeX Academy'}
              className="mb-8 h-16 max-w-48 rounded-xl bg-white/95 object-contain p-2"
            />
          )}
          <p className="text-xs font-black uppercase tracking-[.24em] text-[#00D4FF]">{welcomeText || 'XpeX Academy'}</p>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight xl:text-5xl">
            {title || 'XpeX Academy'}
          </h1>
          {subtitle && (
            <p className="mt-5 text-base font-medium leading-8 text-white/65">{subtitle}</p>
          )}
          {organizationName && <p className="mt-7 text-sm font-semibold text-white/75">{organizationName}</p>}
        </div>

        <p className="text-xs font-semibold leading-5 text-white/55">XpeX Academy</p>
      </div>
    </aside>
  )
}
