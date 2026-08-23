'use client'

import React from 'react'
import { getOrgLogoMediaDirectory, getOrgAuthBackgroundMediaDirectory } from '@services/media/media'
import { cn } from '@/lib/utils'

interface AuthBrandingPanelProps {
  org: any
  welcomeText?: string
  title?: string
  subtitle?: string
}

const visibleOrganizationName = (name?: string) =>
  name && name.trim().toLowerCase() !== 'default organization' ? name : null

const UNSPLASH_UTM = 'utm_source=XpeX_Academy&utm_medium=referral'
const withUnsplashAttribution = (url?: string) => {
  if (!url) return ''
  return `${url}${url.includes('?') ? '&' : '?'}${UNSPLASH_UTM}`
}

export default function AuthBrandingPanel({ org, welcomeText, title, subtitle }: AuthBrandingPanelProps) {
  const branding = org?.config?.config?.customization?.auth_branding
    || org?.config?.config?.general?.auth_branding
    || {}
  const hasCustomBackground = Boolean(branding.background_image && branding.background_type !== 'gradient')
  const backgroundImage = branding.background_type === 'custom'
    ? getOrgAuthBackgroundMediaDirectory(org?.org_uuid, branding.background_image)
    : branding.background_image
  const organizationName = visibleOrganizationName(org?.name)
  const configuredWelcome = typeof branding.welcome_message === 'string' && branding.welcome_message.trim()
    ? branding.welcome_message.trim()
    : null
  const isDarkText = Boolean(org && branding.text_color === 'dark')
  const unsplashPhotographerUrl = withUnsplashAttribution(
    branding.unsplash_photographer_url || 'https://unsplash.com/',
  )
  const unsplashPhotoUrl = withUnsplashAttribution(
    branding.unsplash_photo_url || branding.unsplash_photographer_url || 'https://unsplash.com/',
  )
  const showUnsplashCredit = branding.background_type === 'unsplash'
    && Boolean(backgroundImage)
    && Boolean(branding.unsplash_photographer_name)

  return (
    <aside
      className={cn(
        'relative h-full overflow-hidden bg-[#0B1220]',
        isDarkText ? 'text-slate-950' : 'text-white',
      )}
      aria-label="XpeX Academy"
    >
      {hasCustomBackground && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,122,0,.28),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(0,212,255,.22),transparent_30%)]" />
      <div
        className={cn(
          'absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:32px_32px]',
          isDarkText ? 'opacity-[0.03]' : 'opacity-10',
        )}
      />
      <div
        className={cn(
          'absolute inset-0',
          isDarkText ? 'bg-white/80' : hasCustomBackground ? 'bg-[#0B1220]/90' : 'bg-transparent',
        )}
      />

      <div className="relative z-10 flex h-full flex-col p-10 xl:p-16">
        <div className="inline-flex w-fit items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FF7A00] text-lg font-black text-[#0B1220] shadow-[0_0_36px_rgba(255,122,0,.32)]">XP</span>
          <span>
            <strong className="block tracking-[.2em]">XpeX</strong>
            <small
              className={cn(
                'text-[10px] font-bold uppercase tracking-[.24em]',
                isDarkText ? 'text-slate-700' : 'text-white/55',
              )}
            >
              Academy
            </small>
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
          <p
            className={cn(
              'text-xs font-black uppercase tracking-[.24em]',
              isDarkText ? 'text-[#075985]' : 'text-[#00D4FF]',
            )}
          >
            {configuredWelcome || welcomeText || 'XpeX Academy'}
          </p>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight xl:text-5xl">
            {title || 'XpeX Academy'}
          </h1>
          {subtitle && (
            <p
              className={cn(
                'mt-5 text-base font-medium leading-8',
                isDarkText ? 'text-slate-700' : 'text-white/65',
              )}
            >
              {subtitle}
            </p>
          )}
          {organizationName && (
            <p className={cn('mt-7 text-sm font-semibold', isDarkText ? 'text-slate-800' : 'text-white/75')}>
              {organizationName}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className={cn('text-xs font-semibold leading-5', isDarkText ? 'text-slate-700' : 'text-white/55')}>
            XpeX Academy
          </p>
          {showUnsplashCredit && (
            <p className={cn('text-[11px] font-medium', isDarkText ? 'text-slate-700' : 'text-white/70')}>
              ©{' '}
              <a
                href={unsplashPhotographerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:opacity-80"
              >
                {branding.unsplash_photographer_name}
              </a>
              {' · '}
              <a
                href={unsplashPhotoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:opacity-80"
              >
                Unsplash
              </a>
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
