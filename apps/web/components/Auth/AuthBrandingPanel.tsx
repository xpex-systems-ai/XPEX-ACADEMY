'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import learnhouseIcon from 'public/learnhouse_bigicon_1.png'
import { getOrgLogoMediaDirectory, getOrgAuthBackgroundMediaDirectory } from '@services/media/media'
import { getUriWithOrg } from '@services/config/config'
import { cn } from '@/lib/utils'
import { usePlan } from '@components/Hooks/usePlan'

interface AuthBrandingPanelProps {
  org: any
  welcomeText?: string
  title?: string
  subtitle?: string
}

export default function AuthBrandingPanel({ org, welcomeText }: AuthBrandingPanelProps) {
  const authBranding = org?.config?.config?.customization?.auth_branding || org?.config?.config?.general?.auth_branding || {}
  const {
    welcome_message = '',
    background_type = 'gradient',
    background_image = '',
    text_color = 'light',
    unsplash_photographer_name = '',
    unsplash_photographer_url = '',
    unsplash_photo_url = '',
  } = authBranding
  const UNSPLASH_UTM = '?utm_source=LearnHouse&utm_medium=referral'
  const withUtm = (url: string) => (url ? `${url}${UNSPLASH_UTM}` : '')

  const plan = usePlan()
  const isEnterprise = plan === 'enterprise'
  const noOrg = !org

  const getBackgroundStyle = (): React.CSSProperties => {
    if (noOrg) {
      return {
        background: 'radial-gradient(circle at 18% 12%, rgba(255,106,0,.30), transparent 34%), radial-gradient(circle at 82% 16%, rgba(8,124,255,.30), transparent 32%), linear-gradient(145deg, #02050B 0%, #050D18 56%, #02050B 100%)',
      }
    }
    if (background_type === 'gradient' || !background_image) {
      return {
        background: 'linear-gradient(041.61deg, #202020 7.15%, #000000 90.96%)',
      }
    }
    if (background_type === 'custom' && background_image) {
      return {
        backgroundImage: `url(${getOrgAuthBackgroundMediaDirectory(org?.org_uuid, background_image)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
    if (background_type === 'unsplash' && background_image) {
      return {
        backgroundImage: `url(${background_image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
    return {
      background: 'linear-gradient(041.61deg, #202020 7.15%, #000000 90.96%)',
    }
  }

  const displayMessage = welcome_message || welcomeText || ''
  const hasCustomBackground = !noOrg && background_type !== 'gradient' && background_image

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-16 overflow-hidden rounded-2xl">
        <div className="absolute inset-0" style={getBackgroundStyle()} />

        {!hasCustomBackground && (
          <>
            <div
              className="absolute inset-0 opacity-[0.14]"
              style={{
                backgroundImage: `linear-gradient(rgba(120,165,255,0.6) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(120,165,255,0.6) 1px, transparent 1px),
                  linear-gradient(rgba(120,165,255,0.3) 0.5px, transparent 0.5px),
                  linear-gradient(90deg, rgba(120,165,255,0.3) 0.5px, transparent 0.5px)`,
                backgroundSize: '120px 120px, 120px 120px, 24px 24px, 24px 24px',
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(120,165,255,0.9) 1.5px, transparent 1.5px)',
                backgroundSize: '120px 120px',
              }}
            />
          </>
        )}

        {hasCustomBackground && <div className="absolute inset-0 bg-black/30" />}

        <div className="relative z-10 flex h-full flex-col p-10">
          {!isEnterprise && !noOrg && (
            <div className="login-topbar">
              <Link prefetch href="https://learnhouse.app" target="_blank">
                <img
                  src="/lrn.svg"
                  alt="LearnHouse"
                  width={30}
                  height={30}
                  className={cn(
                    'transition-opacity hover:opacity-100',
                    text_color === 'light' ? 'opacity-60 invert' : 'opacity-40',
                  )}
                />
              </Link>
            </div>
          )}

          {noOrg ? (
            <div className="flex h-full flex-col text-white">
              <Link href="/" className="inline-flex w-fit items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9FF]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#FF6A00] to-[#FF8A2A] text-lg font-black shadow-[0_0_32px_rgba(255,106,0,.30)]">XP</span>
                <span>
                  <strong className="block tracking-[.2em]">XpeX</strong>
                  <small className="text-[10px] font-bold uppercase tracking-[.24em] text-white/55">Academy</small>
                </span>
              </Link>

              <div className="my-auto max-w-md">
                <p className="text-xs font-black uppercase tracking-[.24em] text-[#16D9FF]">Portal educacional Beta</p>
                <h1 className="mt-5 text-[38px] font-black leading-tight tracking-tight">
                  Aprenda, crie e evolua com inteligência artificial.
                </h1>
                <p className="mt-5 text-base font-medium leading-8 text-white/65">
                  Uma experiência guiada que conecta aluno, professora e polo com projetos práticos, acompanhamento humano e tecnologia.
                </p>
              </div>

              <p className="text-xs leading-5 text-white/40">
                Ambiente Beta em integração. Dados demonstrativos e acesso institucional controlado.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-1 items-center justify-center">
                <div className={cn(
                  'flex flex-col items-center gap-6 text-center',
                  text_color === 'light' ? 'text-white' : 'text-gray-900',
                )}>
                  <Link prefetch href={getUriWithOrg(org?.slug, '/')}>
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-white/10">
                      {org?.logo_image ? (
                        <img
                          src={getOrgLogoMediaDirectory(org.org_uuid, org.logo_image)}
                          alt={org.name}
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <Image
                          quality={100}
                          width={96}
                          height={96}
                          src={learnhouseIcon}
                          alt="LearnHouse"
                          className="object-contain"
                        />
                      )}
                    </div>
                  </Link>

                  <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight">{org?.name || 'XpeX Academy'}</h1>
                    {displayMessage && (
                      <p className={cn(
                        'max-w-sm text-lg leading-relaxed',
                        text_color === 'light' ? 'text-white/70' : 'text-gray-600',
                      )}>
                        {displayMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="h-10" />
            </>
          )}

          {background_type === 'unsplash' && background_image && unsplash_photographer_name && (
            <div className={cn(
              'absolute bottom-3 left-4 right-4 z-10 text-[11px] leading-tight',
              text_color === 'light' ? 'text-white/70' : 'text-gray-700',
            )}>
              Photo by{' '}
              <a
                href={withUtm(unsplash_photographer_url) || withUtm(unsplash_photo_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline opacity-90 hover:opacity-100"
              >
                {unsplash_photographer_name}
              </a>
              {' '}on{' '}
              <a
                href={`https://unsplash.com/${UNSPLASH_UTM}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline opacity-90 hover:opacity-100"
              >
                Unsplash
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
