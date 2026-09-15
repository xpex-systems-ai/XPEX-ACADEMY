'use client'

import React from 'react'
import Image from 'next/image'
import { getOrgAuthBackgroundMediaDirectory } from '@services/media/media'
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
  const identityKey = `${org?.name || ''} ${org?.slug || ''}`.toLocaleLowerCase('pt-BR')
  const isKelleDigitalLab = identityKey.includes('kelle')
  const hasCustomBackground = Boolean(branding.background_image && branding.background_type !== 'gradient')
  const backgroundImage = branding.background_type === 'custom'
    ? getOrgAuthBackgroundMediaDirectory(org?.org_uuid, branding.background_image)
    : branding.background_image
  const organizationName = visibleOrganizationName(org?.name)
  const configuredWelcome = typeof branding.welcome_message === 'string' && branding.welcome_message.trim()
    ? branding.welcome_message.trim()
    : null
  // The official Kelle identity always uses the approved cinematic hero and light copy.
  // This prevents stale organization settings from reverting the login to a white panel.
  const isDarkText = !isKelleDigitalLab && Boolean(org && branding.text_color === 'dark')
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
      aria-label={isKelleDigitalLab ? 'Kelle Digital Lab' : 'XpeX Academy'}
    >
      {isKelleDigitalLab ? (
        <Image
          src="/xpex/polos/kelle-digital-lab/hero-background-v2.png"
          alt="Polo Kelle Digital Lab"
          fill
          priority
          sizes="48vw"
          className="object-cover object-center"
        />
      ) : hasCustomBackground ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      ) : null}
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
          isDarkText ? 'bg-white/80' : isKelleDigitalLab ? 'bg-transparent' : hasCustomBackground ? 'bg-[#0B1220]/90' : 'bg-transparent',
        )}
      />

      <div className="relative z-10 flex h-full flex-col p-10 xl:p-16">
        {isKelleDigitalLab ? (
          <div className="relative h-20 w-64" aria-label="Kelle Digital Lab">
            <Image src="/xpex/polos/kelle-digital-lab/logo-horizontal-v2.svg" alt="Kelle Digital Lab" fill sizes="256px" className="object-contain object-left" />
          </div>
        ) : (
          <div className="inline-flex w-fit items-center gap-3 rounded-2xl">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FF7A00] text-lg font-black text-[#0B1220] shadow-[0_0_36px_rgba(255,122,0,.32)]">XP</span>
            <span>
              <strong className="block tracking-[.2em]">XpeX</strong>
              <small className={cn('text-[10px] font-bold uppercase tracking-[.24em]', isDarkText ? 'text-slate-700' : 'text-white/55')}>Academy</small>
            </span>
          </div>
        )}

        <div className={cn('my-auto max-w-lg', isKelleDigitalLab && 'rounded-3xl border border-white/10 bg-[#020814]/70 p-8 shadow-[0_28px_90px_rgba(0,0,0,.42)] backdrop-blur-md')}>
          {organizationName && !isKelleDigitalLab && (
            <div className="mb-8 inline-flex max-w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#00D4FF] text-sm font-black text-[#0B1220]">
                {organizationName.slice(0, 1).toUpperCase()}
              </span>
              <strong className="truncate text-sm font-black uppercase tracking-[.14em]">{organizationName}</strong>
            </div>
          )}
          <p
            className={cn(
              'text-xs font-black uppercase tracking-[.24em]',
              isDarkText ? 'text-[#075985]' : 'text-[#00D4FF]',
            )}
          >
            {isKelleDigitalLab ? 'Seu futuro começa aqui' : configuredWelcome || welcomeText || 'XpeX Academy'}
          </p>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight xl:text-5xl">
            {isKelleDigitalLab ? 'Bem-vindo à Kelle Digital Lab' : title || 'XpeX Academy'}
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
          {organizationName && !isKelleDigitalLab && (
            <p className={cn('mt-7 text-sm font-semibold', isDarkText ? 'text-slate-800' : 'text-white/75')}>
              {organizationName}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <span aria-hidden="true" />
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
