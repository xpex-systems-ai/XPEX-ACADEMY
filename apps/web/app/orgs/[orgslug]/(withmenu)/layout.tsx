'use client'
import { use, useEffect, type ReactNode } from 'react'
import '@styles/globals.css'
import './xpex-learning-shell.css'
import { SessionGate } from '@components/Contexts/LHSessionContext'
import { OrgMenu } from '@components/Objects/Menus/OrgMenu'
import { useOrg } from '@components/Contexts/OrgContext'
import { OrgJoinBanner, OrgJoinBannerProvider } from '@components/Objects/Banners/OrgJoinBanner'
import { PodcastPlayerProvider } from '@components/Contexts/PodcastPlayerContext'
import dynamic from 'next/dynamic'
import { PageViewTracker } from '@components/Analytics/PageViewTracker'
import { usePathname, useSearchParams } from 'next/navigation'
import { getGoogleFontUrl, DEFAULT_FONT } from '@/lib/fonts'

const PodcastPlayer = dynamic(() => import('@components/Objects/Podcasts/PodcastPlayer'), { ssr: false })

const hexToRgba = (hex: string, alpha: number): string => {
  if (!hex || hex.length < 7) return 'transparent'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function OrgFooter() {
  const org = useOrg() as any
  const footerText = org?.config?.config?.customization?.general?.footer_text
    || org?.config?.config?.general?.footer_text
    || 'Tecnologia educacional XpeX Academy'

  return (
    <footer className="xpex-learning-footer">
      <div className="xpex-learning-footer-inner">
        <span className="xpex-learning-footer-mark" aria-hidden="true">XP</span>
        <span>
          <strong>XpeX Academy</strong>
          <small>{footerText}</small>
        </span>
      </div>
    </footer>
  )
}

function LayoutContent({ children, orgslug }: { children: ReactNode; orgslug: string }) {
  const org = useOrg() as any
  const primaryColor = org?.config?.config?.customization?.general?.color || org?.config?.config?.general?.color || ''
  const customFont = org?.config?.config?.customization?.general?.font || org?.config?.config?.general?.font || ''
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const chromeless = searchParams?.get('chrome') === 'none'

  useEffect(() => {
    if (!customFont || customFont === DEFAULT_FONT) return

    const fontId = `gfont-${customFont.replace(/\s/g, '-')}`
    if (document.getElementById(fontId)) return

    const preconnect1 = document.createElement('link')
    preconnect1.rel = 'preconnect'
    preconnect1.href = 'https://fonts.googleapis.com'
    document.head.appendChild(preconnect1)

    const preconnect2 = document.createElement('link')
    preconnect2.rel = 'preconnect'
    preconnect2.href = 'https://fonts.gstatic.com'
    preconnect2.crossOrigin = 'anonymous'
    document.head.appendChild(preconnect2)

    const link = document.createElement('link')
    link.id = fontId
    link.rel = 'stylesheet'
    link.href = getGoogleFontUrl(customFont)
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(preconnect1)
      document.head.removeChild(preconnect2)
      const existing = document.getElementById(fontId)
      if (existing) document.head.removeChild(existing)
    }
  }, [customFont])

  const pathParts = pathname?.split('/').filter(Boolean) || []
  const isFullBleedPage = ['copilot'].some((part) => pathParts.includes(part))

  return (
    <div
      className="xpex-learning-shell flex min-h-screen flex-col"
      style={{
        '--xpex-org-accent': primaryColor || '#FF7A00',
        '--xpex-org-glow': primaryColor ? hexToRgba(primaryColor, 0.18) : 'rgba(255,122,0,0.18)',
        ...(customFont ? { fontFamily: `'${customFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` } : {}),
      } as React.CSSProperties}
    >
      <PageViewTracker />
      {!chromeless && <OrgJoinBanner />}
      {!chromeless && <OrgMenu orgslug={orgslug} />}
      <div className="xpex-learning-content relative flex-1" style={{ zIndex: 'var(--z-content)' }}>
        {children}
      </div>
      {!isFullBleedPage && !chromeless && <OrgFooter />}
    </div>
  )
}

export default function RootLayout(props: { children: ReactNode; params: Promise<any> }) {
  const params = use(props.params)
  return (
    <SessionGate>
      <OrgJoinBannerProvider>
        <PodcastPlayerProvider>
          <LayoutContent orgslug={params?.orgslug}>{props.children}</LayoutContent>
          <PodcastPlayer />
        </PodcastPlayerProvider>
      </OrgJoinBannerProvider>
    </SessionGate>
  )
}
