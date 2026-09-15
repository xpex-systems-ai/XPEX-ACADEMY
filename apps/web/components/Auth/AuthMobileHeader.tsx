'use client'

import React from 'react'
import Image from 'next/image'
import { getOrgAuthBackgroundMediaDirectory } from '@services/media/media'
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
  const identityKey = `${org?.name || ''} ${org?.slug || ''}`.toLocaleLowerCase('pt-BR')
  const isKelleDigitalLab = identityKey.includes('kelle')
  const hasCustomBackground = Boolean(branding.background_image && branding.background_type !== 'gradient')
  const backgroundImage = branding.background_type === 'custom'
    ? getOrgAuthBackgroundMediaDirectory(org?.org_uuid, branding.background_image)
    : branding.background_image
  const isDarkText = !isKelleDigitalLab && Boolean(org && branding.text_color === 'dark')
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
      aria-label={isKelleDigitalLab ? 'Kelle Digital Lab' : 'XpeX Academy'}
      className={cn(
        'relative overflow-hidden border-b border-white/10 bg-[#0B1220] px-5 py-4',
        isKelleDigitalLab && 'min-h-[172px] flex flex-col justify-end',
        isDarkText ? 'text-slate-950' : 'text-white',
      )}
    >
      {isKelleDigitalLab ? (
        <Image
          src="/xpex/polos/kelle-digital-lab/hero-background-v2.png"
          alt="Polo Kelle Digital Lab"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      ) : hasCustomBackground ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(255,122,0,.24),transparent_42%),radial-gradient(circle_at_90%_0%,rgba(0,212,255,.20),transparent_40%)]" />
      <div
        className={cn(
          'absolute inset-0',
          isDarkText ? 'bg-white/80' : isKelleDigitalLab ? 'bg-gradient-to-t from-[#020814]/70 via-transparent to-transparent' : hasCustomBackground ? 'bg-[#0B1220]/90' : 'bg-transparent',
        )}
      />

      <div className="relative z-10 flex items-center gap-3 pr-20">
        {isKelleDigitalLab ? (
          <div className="relative h-16 w-52">
            <Image src="/xpex/polos/kelle-digital-lab/logo-horizontal-v2.svg" alt="Kelle Digital Lab" fill sizes="208px" className="object-contain object-left" />
          </div>
        ) : (
          <>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#FF7A00] text-sm font-black text-[#0B1220] shadow-[0_0_24px_rgba(255,122,0,.24)]">XP</span>
            <span>
              <strong className="block text-sm tracking-[.18em]">XpeX</strong>
              <small className={cn('text-[9px] font-bold uppercase tracking-[.22em]', isDarkText ? 'text-slate-700' : 'text-white/55')}>Academy</small>
            </span>
          </>
        )}
        {organizationName && !isKelleDigitalLab && (
          <span className="ml-auto max-w-36 truncate rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[.12em]">
            {organizationName}
          </span>
        )}
      </div>

      {organizationName && !isKelleDigitalLab && (
        <p
          className={cn(
            'relative z-10 mt-2 truncate pr-20 text-xs font-semibold',
            isDarkText ? 'text-slate-800' : 'text-white/75',
          )}
        >
          {organizationName}
        </p>
      )}

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
