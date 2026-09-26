'use client'

import React, { useState, useEffect } from 'react'
import { PulseHero } from './PulseHero'
import { PulseToolbar, PulseSearchResultsView } from './PulseToolbar'
import { PulseVideoBlock } from './PulseVideoBlock'
import { PulseNewsBlock } from './PulseNewsBlock'
import { PulseTrendsBlock } from './PulseTrendsBlock'
import { PulseTechBlock } from './PulseTechBlock'
import { PulseRadarBlock } from './PulseRadarBlock'
import { PulseXaraBlock } from './PulseXaraBlock'
import {
  fetchPulseVideos,
  fetchPulseNews,
  fetchPulseTrends,
  fetchPulseTech,
  fetchPulseRadar,
  fetchPulseXara,
} from '@services/pulse/pulse'
import type {
  PulseVideoItem,
  PulseNewsItem,
  PulseTrendItem,
  PulseTechItem,
  PulseRadarItem,
  PulseXaraItem,
  PulseItem,
} from '@/types/pulse'
import './pulse.css'

interface PulseHomeProps {
  /** Passed from server page for future personalization hooks */
  displayName: string
  organizationSlug: string
}

/**
 * PulseHome — root client component for /xpex/pulse.
 *
 * Loads curated V1 content only when the Firebase Fabric feature gate allows it.
 * Remote Config can disable Pulse without a code deployment; if Firebase is
 * unavailable, the code-authoritative default remains the safe fallback.
 */
export function PulseHome({ displayName: _displayName, organizationSlug: _organizationSlug }: PulseHomeProps) {
  const [pulseEnabled, setPulseEnabled] = useState<boolean | null>(null)
  const [videos, setVideos] = useState<PulseVideoItem[]>([])
  const [news, setNews] = useState<PulseNewsItem[]>([])
  const [trends, setTrends] = useState<PulseTrendItem[]>([])
  const [tech, setTech] = useState<PulseTechItem[]>([])
  const [radar, setRadar] = useState<PulseRadarItem[]>([])
  const [xara, setXara] = useState<PulseXaraItem[]>([])

  const [searchActive, setSearchActive] = useState(false)
  const [searchResults, setSearchResults] = useState<PulseItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Resolve the Firebase Remote Config feature gate before loading the product.
  useEffect(() => {
    let mounted = true

    import('@/lib/firebase')
      .then(async ({ initFirebaseFabric, isFeatureEnabled, trackXpexEvent }) => {
        await initFirebaseFabric()
        const enabled = isFeatureEnabled('pulse_enabled')
        if (!mounted) return
        setPulseEnabled(enabled)
        if (enabled) {
          trackXpexEvent('pulse_opened', {})
        }
      })
      .catch(() => {
        // Firebase is optional for availability. Fall back to the code default.
        if (mounted) setPulseEnabled(true)
      })

    return () => {
      mounted = false
    }
  }, [])

  // Load curated blocks only after the feature gate resolves enabled.
  useEffect(() => {
    if (pulseEnabled !== true) return

    let mounted = true
    async function loadAll() {
      const [v, n, tr, te, r, x] = await Promise.all([
        fetchPulseVideos(),
        fetchPulseNews(),
        fetchPulseTrends(),
        fetchPulseTech(),
        fetchPulseRadar(),
        fetchPulseXara(),
      ])
      if (!mounted) return
      setVideos(v.items)
      setNews(n.items)
      setTrends(tr.items)
      setTech(te.items)
      setRadar(r.items)
      setXara(x.items)
    }

    loadAll()
    return () => {
      mounted = false
    }
  }, [pulseEnabled])

  const handleSearchActive = (active: boolean) => {
    setSearchActive(active)
    if (!active) {
      setSearchResults([])
      setSearchQuery('')
      return
    }

    import('@/lib/firebase').then(({ trackXpexEvent }) => {
      trackXpexEvent('pulse_search', {})
    }).catch(() => { /* Firebase optional */ })
  }

  if (pulseEnabled === null) {
    return (
      <div className="pulse-container" aria-live="polite">
        <div className="pulse-status-notice" role="status">
          Preparando o XPeX Pulse…
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
        onSearchActive={handleSearchActive}
        onResults={setSearchResults}
        onQuery={setSearchQuery}
      />

      {searchActive ? (
        <PulseSearchResultsView items={searchResults} query={searchQuery} />
      ) : (
        <>
          {videos.length > 0 && (
            <PulseVideoBlock items={videos} label="Curado" />
          )}

          {news.length > 0 && (
            <PulseNewsBlock items={news} label="Curado" />
          )}

          {trends.length > 0 && (
            <PulseTrendsBlock items={trends} label="Curado" />
          )}

          {tech.length > 0 && (
            <PulseTechBlock items={tech} label="Curado" />
          )}

          {radar.length > 0 && (
            <PulseRadarBlock items={radar} label="Curado" />
          )}

          {xara.length > 0 && (
            <PulseXaraBlock items={xara} label="Curado" />
          )}

          <div className="pulse-footer-tagline" aria-label="Tagline XPeX Pulse">
            Mais conhecimento. Mais oportunidades. Um futuro real.
          </div>
        </>
      )}
    </div>
  )
}
