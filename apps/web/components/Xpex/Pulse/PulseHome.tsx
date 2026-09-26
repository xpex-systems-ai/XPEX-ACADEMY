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
 * Loads all content blocks from the curated adapter.
 * Handles search activation / results overlay.
 * Fires Firebase Analytics events via dynamic import (non-blocking).
 */
export function PulseHome({ displayName: _displayName, organizationSlug: _organizationSlug }: PulseHomeProps) {
  const [videos, setVideos] = useState<PulseVideoItem[]>([])
  const [news, setNews] = useState<PulseNewsItem[]>([])
  const [trends, setTrends] = useState<PulseTrendItem[]>([])
  const [tech, setTech] = useState<PulseTechItem[]>([])
  const [radar, setRadar] = useState<PulseRadarItem[]>([])
  const [xara, setXara] = useState<PulseXaraItem[]>([])

  const [searchActive, setSearchActive] = useState(false)
  const [searchResults, setSearchResults] = useState<PulseItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Fire pulse_opened analytics event (non-blocking)
  useEffect(() => {
    import('@/lib/firebase').then(({ trackXpexEvent }) => {
      trackXpexEvent('pulse_opened', {})
    }).catch(() => { /* Firebase optional */ })
  }, [])

  // Load all blocks
  useEffect(() => {
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
    return () => { mounted = false }
  }, [])

  const handleSearchActive = (active: boolean) => {
    setSearchActive(active)
    if (!active) {
      setSearchResults([])
      setSearchQuery('')
    } else {
      // Fire pulse_search event
      import('@/lib/firebase').then(({ trackXpexEvent }) => {
        trackXpexEvent('pulse_search', {})
      }).catch(() => { /* Firebase optional */ })
    }
  }

  return (
    <div className="pulse-container">
      {/* 1. Hero */}
      <PulseHero />

      {/* 2. Toolbar + Search */}
      <PulseToolbar
        onSearchActive={handleSearchActive}
        onResults={setSearchResults}
        onQuery={setSearchQuery}
      />

      {/* 3. Search results overlay (replaces content blocks when active) */}
      {searchActive ? (
        <PulseSearchResultsView items={searchResults} query={searchQuery} />
      ) : (
        <>
          {/* 4. Vídeos Curados */}
          {videos.length > 0 && (
            <PulseVideoBlock items={videos} label="Curado" />
          )}

          {/* 5. Notícias + Tendências side-by-side sections */}
          {news.length > 0 && (
            <PulseNewsBlock items={news} label="Curado" />
          )}

          {trends.length > 0 && (
            <PulseTrendsBlock items={trends} label="Curado" />
          )}

          {/* 6. Tecnologias Emergentes */}
          {tech.length > 0 && (
            <PulseTechBlock items={tech} label="Curado" />
          )}

          {/* 7. Radar XPeX + Aprenda com XARA */}
          {radar.length > 0 && (
            <PulseRadarBlock items={radar} label="Curado" />
          )}

          {xara.length > 0 && (
            <PulseXaraBlock items={xara} label="Curado" />
          )}

          {/* 8. Footer tagline */}
          <div className="pulse-footer-tagline" aria-label="Tagline XPeX Pulse">
            Mais conhecimento. Mais oportunidades. Um futuro real.
          </div>
        </>
      )}
    </div>
  )
}
