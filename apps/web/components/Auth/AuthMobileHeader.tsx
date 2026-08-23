'use client'

import React from 'react'
import { getOrgLogoMediaDirectory, getOrgAuthBackgroundMediaDirectory } from '@services/media/media'
import { cn } from '@/lib/utils'

const UNSPLASH_UTM = 'utm_source=XpeX_Academy&utm_medium=referral'
const withUnsplashAttribution = (url?: string) => {
  if (!url) return ''
  return `${url}${url.includes('?') ? '&' : '?'}${UNSPLASH_UTM}`
}

export default function AuthMobileHeader({ org }: { org: any }) {
  const branding = org?.config?.config?.customization?.auth_branding
    || org?.config?.config?.general?.auth_branding
    || {}
  const hasCustomBackground = Boolean(branding.background_image && branding.background_type !== 'gradient')
  const backgroundImage = branding.background_type === 'custom'
    ? getOrgAuthBackgroundMediaDirectory(org?.org_uuid, branding.background_image)
    : branding.background_image
  const isDarkText = Boolean(org && branding.text_color === 'dark')
  const organizationName = org?.name && org.name.trim().toLowerCase() !== 'default organization'
    ? org.name
    : null
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
    <header
      aria-label="XpeX Academy"
      className={cn(
        'relative overflow-hidden border-b border-white/10 bg-[#0B1220] px-5 py-4',
        isDarkText ? 'text-slate-950' : 'text-white',
      )}
    >
      {hasCustomBackground && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(255,122,0,.24),transparent_42%),radial-gradient(circle_at_90%_0%,rgba(0,212,255,.20),transparent_40%)]" />
      <div
        className={cn(
          'absolute inset-0',
          isDarkText ? 'bg-white/80' : hasCustomBackground ? 'bg-[#0B1220]/90' : 'bg-transparent',
        )}
      />

      <div className="relative z-10 flex items-center gap-3 pr-20">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#FF7A00] text-sm font-black text-[#0B1220] shadow-[0_0_24px_rgba(255,122,0,.24)]">XP</span>
        <span>
          <strong className="block text-sm tracking-[.18em]">XpeX</strong>
          <small
            className={cn(
              'text-[9px] font-bold uppercase tracking-[.22em]',
              isDarkText ? 'text-slate-700' : 'text-white/55',
            )}
          >
            Academy
          </small>
        </span>
        {org?.logo_image && (
          <img
            src={getOrgLogoMediaDirectory(org.org_uuid, org.logo_image)}
            alt={organizationName || 'XpeX Academy'}
            className="ml-auto h-10 max-w-32 rounded-lg bg-white/95 object-contain p-1.5"
          />
        )}
      </div>

      {showUnsplashCredit && (
        <p
          className={cn(
            'relative z-10 mt-2 text-right text-[10px] font-medium',
            isDarkText ? 'text-slate-700' : 'text-white/70',
          )}
        >
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
    </header>
  )
}
