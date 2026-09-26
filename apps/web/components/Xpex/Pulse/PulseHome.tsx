'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { PulseHero } from './PulseHero'
import { PulseToolbar, PulseSearchResultsView } from './PulseToolbar'
import { PulseMainPlayer } from './PulseMainPlayer'
import { PulseVideoQueue } from './PulseVideoQueue'
import { PulseCuratedVideos } from './PulseCuratedVideos'
import { PulseStudentProgressCard } from './PulseStudentProgressCard'
import { PulseNewsBlock } from './PulseNewsBlock'
import { PulseTrendsBlock } from './PulseTrendsBlock'
import { PulseTechBlock } from './PulseTechBlock'
import { PulseRadarBlock } from './PulseRadarBlock'
import { PulseXaraBlock } from './PulseXaraBlock'
import { PulseResourceGrid } from './PulseResourceGrid'
import {
  fetchPulseVideos,
  fetchPulseNews,
  fetchPulseTrends,
  fetchPulseTech,
  fetchPulseRadar,
  fetchPulseXara,
  fetchStudentPulseProgress,
  fetchPulseResourceCards,
} from '@services/pulse/pulse'
import type {
  PulseBlockResult,
  PulseVideoItem,
  PulseNewsItem,
  PulseTrendItem,
  PulseTechItem,
  PulseRadarItem,
  PulseXaraItem,
  PulseItem,
  PulseCategory,
  PulseStudentProgress,
  PulseResourceCard,
} from '@/types/pulse'
import './pulse.css'

interface PulseHomeProps {
  accessToken: string
  displayName?: string
  organizationSlug?: string
}

export function PulseHome({ accessToken, displayName = 'Aluno XPeX', organizationSlug = 'default' }: PulseHomeProps) {
  const [pulseEnabled, setPulseEnabled] = useState<boolean | null>(null)
  const [moduleFlags, setModuleFlags] = useState({
    news: true,
    trends: true,
    xara: true,
    liveSources: false,
    youtubeApi: false,
  })

  const [videoBlock, setVideoBlock] = useState<PulseBlockResult<PulseVideoItem>>({
    items: [],
    label: 'Curado',
    live: false,
    fetchedAt: '',
  })
  const [activeVideo, setActiveVideo] = useState<PulseVideoItem | null>(null)

  const [newsBlock, setNewsBlock] = useState<PulseBlockResult<PulseNewsItem>>({
    items: [],
    label: 'Curado',
    live: false,
    fetchedAt: '',
  })
  const [trendBlock, setTrendBlock] = useState<PulseBlockResult<PulseTrendItem>>({
    items: [],
    label: 'Curado',
    live: false,
    fetchedAt: '',
  })
  const [techBlock, setTechBlock] = useState<PulseBlockResult<PulseTechItem>>({
    items: [],
    label: 'Curado',
    live: false,
    fetchedAt: '',
  })
  const [radarBlock, setRadarBlock] = useState<PulseBlockResult<PulseRadarItem>>({
    items: [],
    label: 'Curado',
    live: false,
    fetchedAt: '',
  })
  const [xaraBlock, setXaraBlock] = useState<PulseBlockResult<PulseXaraItem>>({
    items: [],
    label: 'Disponível',
    live: false,
    fetchedAt: '',
  })

  const [progress, setProgress] = useState<PulseStudentProgress | undefined>(undefined)
  const [resourceCards, setResourceCards] = useState<PulseResourceCard[]>([])

  const [activeCategory, setActiveCategory] = useState<PulseCategory>('all')
  const [searchActive, setSearchActive] = useState(false)
  const [searchResults, setSearchResults] = useState<PulseItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [xaraPromptRequest, setXaraPromptRequest] = useState<string | undefined>(undefined)

  // Resolve Firebase Remote Config feature gates
  useEffect(() => {
    let mounted = true

    import('@/lib/firebase')
      .then(async ({ initFirebaseFabric, isFeatureEnabled, trackXpexEvent }) => {
        await initFirebaseFabric()
        const enabled = isFeatureEnabled('pulse_enabled')
        const newsEnabled = isFeatureEnabled('pulse_news_enabled')
        const trendsEnabled = isFeatureEnabled('pulse_trends_enabled')
        const xaraEnabled = isFeatureEnabled('pulse_xara_enabled')
        const liveSourcesEnabled = isFeatureEnabled('pulse_live_sources_enabled')
        const youtubeApiEnabled = isFeatureEnabled('pulse_youtube_api_enabled')

        if (!mounted) return
        setPulseEnabled(enabled)
        setModuleFlags({
          news: newsEnabled,
          trends: trendsEnabled,
          xara: xaraEnabled,
          liveSources: liveSourcesEnabled,
          youtubeApi: youtubeApiEnabled,
        })
        if (enabled) {
          trackXpexEvent('pulse_opened', {})
        }
      })
      .catch(() => {
        if (mounted) setPulseEnabled(true)
      })

    return () => {
      mounted = false
    }
  }, [])

  // Load all Pulse V2 data modules with honest block metadata
  useEffect(() => {
    if (pulseEnabled !== true) return

    let mounted = true
    async function loadAll() {
      const [fallbackVideos, fallbackNews, tr, te, r, x, p, res] = await Promise.all([
        fetchPulseVideos(),
        fetchPulseNews(),
        fetchPulseTrends(),
        fetchPulseTech(),
        fetchPulseRadar(),
        fetchPulseXara(),
        fetchStudentPulseProgress(displayName),
        fetchPulseResourceCards(),
      ])

      let v = fallbackVideos
      let n = fallbackNews

      if (moduleFlags.liveSources) {
        try {
          const params = new URLSearchParams({
            youtube: moduleFlags.youtubeApi ? '1' : '0',
            news: moduleFlags.news ? '1' : '0',
          })
          const response = await fetch(`/xpex/pulse/feed?${params.toString()}`, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
          })

          if (response.ok) {
            const livePayload = await response.json()
            if (livePayload?.videos?.items?.length) v = livePayload.videos
            if (livePayload?.news?.items?.length) n = livePayload.news
          }
        } catch {
          // Curated fallback remains active if the live source fabric is unavailable.
        }
      }

      if (!mounted) return
      setVideoBlock(v)
      if (v.items.length > 0) {
        setActiveVideo(v.items.find((item) => item.isFeatured) || v.items[0])
      }
      setNewsBlock(n)
      setTrendBlock(tr)
      setTechBlock(te)
      setRadarBlock(r)
      setXaraBlock(x)
      setProgress(p)
      setResourceCards(res)
    }

    loadAll()
    return () => {
      mounted = false
    }
  }, [pulseEnabled, displayName, moduleFlags.liveSources, moduleFlags.youtubeApi, moduleFlags.news])

  // Unified dataset for real-time search across all currently loaded blocks
  const currentItems = useMemo<PulseItem[]>(() => [
    ...videoBlock.items,
    ...newsBlock.items,
    ...trendBlock.items,
    ...techBlock.items,
    ...radarBlock.items,
    ...xaraBlock.items,
  ], [videoBlock, newsBlock, trendBlock, techBlock, radarBlock, xaraBlock])

  const handleSelectVideo = useCallback((video: PulseVideoItem) => {
    setActiveVideo(video)
    if (typeof window !== 'undefined') {
      const el = document.getElementById('pulse-main-player')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
    import('@/lib/firebase')
      .then(({ trackXpexEvent }) => {
        trackXpexEvent('pulse_content_started', { video_id: video.id, title: video.title })
      })
      .catch(() => {})
  }, [])

  const handleSaveVideo = useCallback((video: PulseVideoItem) => {
    import('@/lib/firebase')
      .then(({ trackXpexEvent }) => {
        trackXpexEvent('pulse_content_saved', { video_id: video.id, title: video.title })
      })
      .catch(() => {})
  }, [])

  const handleAskXaraFromPlayer = useCallback((prompt: string) => {
    setXaraPromptRequest(prompt)
    if (typeof window !== 'undefined') {
      const xaraEl = document.getElementById('pulse-xara-panel')
      if (xaraEl) {
        xaraEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [])

  const handleCategoryChange = useCallback((cat: PulseCategory) => {
    setActiveCategory(cat)
    import('@/lib/firebase')
      .then(({ trackXpexEvent }) => {
        trackXpexEvent('pulse_filter_selected', { category: cat })
      })
      .catch(() => {})
  }, [])

  const handleSearchActive = useCallback((active: boolean) => {
    setSearchActive(active)
    if (!active) {
      setSearchResults([])
      setSearchQuery('')
      return
    }
    import('@/lib/firebase')
      .then(({ trackXpexEvent }) => {
        trackXpexEvent('pulse_search', {})
      })
      .catch(() => {})
  }, [])

  if (pulseEnabled === null) {
    return (
      <div className="pulse-container" aria-live="polite">
        <div className="pulse-status-notice" role="status">
          <span className="pulse-spinner" aria-hidden="true" />
          <span>Carregando o XPeX Pulse V2…</span>
        </div>
      </div>
    )
  }

  if (!pulseEnabled) {
    return (
      <div className="pulse-container" aria-live="polite">
        <div className="pulse-status-notice" role="status">
          XPeX Pulse está temporariamente indisponível neste ambiente.
        </div>
      </div>
    )
  }

  return (
    <div className="pulse-container">
      <PulseHero />

      <PulseToolbar
        activeCategory={activeCategory}
        items={currentItems}
        onCategoryChange={handleCategoryChange}
        onSearchActive={handleSearchActive}
        onResults={setSearchResults}
        onQuery={setSearchQuery}
      />

      {searchActive ? (
        <PulseSearchResultsView
          items={searchResults}
          query={searchQuery}
          onSelectItem={(item) => {
            if (item.category === 'videos' && item.youtubeId) {
              handleSelectVideo(item as PulseVideoItem)
              setSearchActive(false)
            }
          }}
        />
      ) : (
        <>
          {/* Main Stage: Player + Progress on Left, Video Queue on Right */}
          <section className="pulse-main-stage-grid" aria-label="Área Principal de Reprodução">
            <div className="pulse-stage-left-col">
              <PulseMainPlayer
                activeVideo={activeVideo}
                onAskXara={handleAskXaraFromPlayer}
                onSaveVideo={handleSaveVideo}
              />
              <PulseStudentProgressCard progress={progress} displayName={displayName} />
            </div>

            <div className="pulse-stage-right-col">
              {videoBlock.items.length > 0 && (
                <PulseVideoQueue
                  videos={videoBlock.items}
                  activeVideoId={activeVideo?.id || ''}
                  onSelectVideo={handleSelectVideo}
                />
              )}
            </div>
          </section>

          {/* Curated Videos Carousel / Grid */}
          {videoBlock.items.length > 0 && (
            <PulseCuratedVideos
              items={videoBlock.items}
              label={videoBlock.label}
              onSelectVideo={handleSelectVideo}
            />
          )}

          {/* Tri-Column Intelligence Hub */}
          <section className="pulse-tri-column-grid" aria-label="Central de Notícias, Tendências e Tecnologias">
            <div className="pulse-tri-col">
              {moduleFlags.news && newsBlock.items.length > 0 && (
                <PulseNewsBlock items={newsBlock.items} label={newsBlock.label} />
              )}
            </div>
            <div className="pulse-tri-col">
              {moduleFlags.trends && trendBlock.items.length > 0 && (
                <PulseTrendsBlock items={trendBlock.items} label={trendBlock.label} />
              )}
            </div>
            <div className="pulse-tri-col">
              {techBlock.items.length > 0 && (
                <PulseTechBlock items={techBlock.items} label={techBlock.label} />
              )}
            </div>
          </section>

          {/* Radar + XARA Bridge Row */}
          <section className="pulse-dual-bottom-grid" aria-label="Radar e Mentor Pedagógico XARA">
            <div className="pulse-dual-col">
              {radarBlock.items.length > 0 && (
                <PulseRadarBlock items={radarBlock.items} label={radarBlock.label} />
              )}
            </div>
            <div className="pulse-dual-col">
              {moduleFlags.xara && (
                <PulseXaraBlock
                  items={xaraBlock.items}
                  label={xaraBlock.label}
                  accessToken={accessToken}
                  organizationSlug={organizationSlug}
                  activeVideoTitle={activeVideo?.title}
                  initialPrompt={xaraPromptRequest}
                />
              )}
            </div>
          </section>

          {/* Bottom Resource Cards */}
          {resourceCards.length > 0 && <PulseResourceGrid cards={resourceCards} />}

          <footer className="pulse-footer-tagline" aria-label="Tagline XPeX Pulse">
            <p>Mais conhecimento. Mais oportunidades. Um futuro real.</p>
          </footer>
        </>
      )}
    </div>
  )
}
