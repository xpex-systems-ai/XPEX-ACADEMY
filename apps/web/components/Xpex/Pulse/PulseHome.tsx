'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  const [videos, setVideos] = useState<PulseVideoItem[]>([])
  const [activeVideo, setActiveVideo] = useState<PulseVideoItem | null>(null)
  const [news, setNews] = useState<PulseNewsItem[]>([])
  const [trends, setTrends] = useState<PulseTrendItem[]>([])
  const [tech, setTech] = useState<PulseTechItem[]>([])
  const [radar, setRadar] = useState<PulseRadarItem[]>([])
  const [xara, setXara] = useState<PulseXaraItem[]>([])
  const [progress, setProgress] = useState<PulseStudentProgress | undefined>(undefined)
  const [resourceCards, setResourceCards] = useState<PulseResourceCard[]>([])

  const [activeCategory, setActiveCategory] = useState<PulseCategory>('all')
  const [searchActive, setSearchActive] = useState(false)
  const [searchResults, setSearchResults] = useState<PulseItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [xaraPromptRequest, setXaraPromptRequest] = useState<string | undefined>(undefined)

  // Resolve Firebase Remote Config feature gate
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

  // Load all Pulse V2 data modules
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
      setVideos(v.items)
      if (v.items.length > 0) {
        setActiveVideo(v.items.find((item) => item.isFeatured) || v.items[0])
      }
      setNews(n.items)
      setTrends(tr.items)
      setTech(te.items)
      setRadar(r.items)
      setXara(x.items)
      setProgress(p)
      setResourceCards(res)
    }

    loadAll()
    return () => {
      mounted = false
    }
  }, [pulseEnabled, displayName, moduleFlags.liveSources, moduleFlags.youtubeApi, moduleFlags.news])

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
              {videos.length > 0 && (
                <PulseVideoQueue
                  videos={videos}
                  activeVideoId={activeVideo?.id || ''}
                  onSelectVideo={handleSelectVideo}
                />
              )}
            </div>
          </section>

          {/* Curated Videos Carousel / Grid */}
          {videos.length > 0 && (
            <PulseCuratedVideos
              items={videos}
              label="Curado"
              onSelectVideo={handleSelectVideo}
            />
          )}

          {/* Tri-Column Intelligence Hub */}
          <section className="pulse-tri-column-grid" aria-label="Central de Notícias, Tendências e Tecnologias">
            <div className="pulse-tri-col">
              {moduleFlags.news && news.length > 0 && <PulseNewsBlock items={news} label="Curado" />}
            </div>
            <div className="pulse-tri-col">
              {moduleFlags.trends && trends.length > 0 && <PulseTrendsBlock items={trends} label="Curado" />}
            </div>
            <div className="pulse-tri-col">
              {tech.length > 0 && <PulseTechBlock items={tech} label="Curado" />}
            </div>
          </section>

          {/* Radar + XARA Bridge Row */}
          <section className="pulse-dual-bottom-grid" aria-label="Radar e Mentor Pedagógico XARA">
            <div className="pulse-dual-col">
              {radar.length > 0 && <PulseRadarBlock items={radar} label="Curado" />}
            </div>
            <div className="pulse-dual-col">
              {moduleFlags.xara && (
                <PulseXaraBlock
                  items={xara}
                  label="Disponível"
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
