/**
 * XPeX Pulse — Unified Source Registry & Ingestion Fabric
 * MISSION: XPEX-PULSE-LIVE-SOURCES-002
 *
 * Implements the deterministic priority chain:
 * 1. LIVE (if enabled & successful -> save cache, return 'Atualizado', live: true, sourceState: 'live')
 * 2. FRESH CACHE (if live disabled/failed -> return 'Em cache', live: false, sourceState: 'fresh-cache')
 * 3. STALE CACHE (if fresh cache expired -> return 'Em cache', live: false, sourceState: 'stale-cache')
 * 4. CURATED FALLBACK (if cache empty -> return 'Curado', live: false, sourceState: 'curated')
 * 5. EMPTY / UNAVAILABLE (if no fallback -> return 'Indisponível', live: false, sourceState: 'unavailable')
 */

import 'server-only'

import { youtubeLiveSource } from './youtube'
import { newsFeedLiveSource } from './rss'
import { pulseCache } from './cache'
import {
  FALLBACK_VIDEOS,
  FALLBACK_QUEUE_ITEMS,
  FALLBACK_NEWS,
  FALLBACK_TRENDS,
  FALLBACK_TECH,
  FALLBACK_RADAR,
  FALLBACK_XARA,
  FALLBACK_RESOURCE_CARDS,
} from './fallback'
import type {
  PulseSourceHealthRecord,
} from './types'
import type {
  PulseBlockResult,
  PulseVideoItem,
  PulseVideoQueueItem,
  PulseNewsItem,
  PulseTrendItem,
  PulseTechItem,
  PulseRadarItem,
  PulseXaraItem,
  PulseResourceCard,
  PulseItem,
} from '@/types/pulse'

export class PulseSourceRegistry {
  private readonly CACHE_KEY_VIDEOS = 'pulse:sources:videos'
  private readonly CACHE_KEY_NEWS = 'pulse:sources:news'
  private readonly CACHE_KEY_TRENDS = 'pulse:sources:trends'
  private readonly CACHE_KEY_TECH = 'pulse:sources:tech'
  private readonly CACHE_KEY_RADAR = 'pulse:sources:radar'

  async getVideos(liveSourcesEnabled = false): Promise<PulseBlockResult<PulseVideoItem>> {
    const now = new Date().toISOString()

    // 1. LIVE attempt if feature flag allows
    if (liveSourcesEnabled) {
      try {
        const liveItems = await youtubeLiveSource.fetch()
        if (liveItems && liveItems.length > 0) {
          await pulseCache.set(this.CACHE_KEY_VIDEOS, liveItems, 3600, 'Atualizado')
          return {
            items: liveItems,
            label: 'Atualizado',
            live: true,
            fetchedAt: now,
            sourceState: 'live',
          }
        }
      } catch {
        // Fall through to cache/fallback
      }
    }

    // 2. FRESH CACHE check
    const cached = await pulseCache.get<PulseVideoItem[]>(this.CACHE_KEY_VIDEOS)
    if (cached && cached.length > 0) {
      return {
        items: cached,
        label: 'Em cache',
        live: false,
        fetchedAt: now,
        sourceState: 'fresh-cache',
      }
    }

    // 3. STALE CACHE fallback check
    const stale = await pulseCache.getStaleFallback<PulseVideoItem[]>(this.CACHE_KEY_VIDEOS)
    if (stale && stale.data && stale.data.length > 0) {
      return {
        items: stale.data,
        label: 'Em cache',
        live: false,
        fetchedAt: now,
        sourceState: 'stale-cache',
      }
    }

    // 4. CURATED FALLBACK
    return {
      items: FALLBACK_VIDEOS,
      label: 'Curado',
      live: false,
      fetchedAt: now,
      sourceState: 'curated',
    }
  }

  async getVideoQueue(liveSourcesEnabled = false): Promise<PulseVideoQueueItem[]> {
    const videoResult = await this.getVideos(liveSourcesEnabled)
    return videoResult.items.map((v, index) => ({
      id: v.id,
      title: v.title,
      channelName: v.channelName,
      durationLabel: v.durationLabel ?? '—',
      youtubeId: v.youtubeId,
      category: v.category,
      viewsCountLabel: v.viewsCountLabel,
      publishedAtRelative: index === 0 ? 'Em reprodução' : undefined,
      active: index === 0,
    })) || FALLBACK_QUEUE_ITEMS
  }

  async getNews(liveSourcesEnabled = false): Promise<PulseBlockResult<PulseNewsItem>> {
    const now = new Date().toISOString()

    // 1. LIVE attempt
    if (liveSourcesEnabled) {
      try {
        const liveItems = await newsFeedLiveSource.fetch()
        if (liveItems && liveItems.length > 0) {
          await pulseCache.set(this.CACHE_KEY_NEWS, liveItems, 900, 'Atualizado')
          return {
            items: liveItems,
            label: 'Atualizado',
            live: true,
            fetchedAt: now,
            sourceState: 'live',
          }
        }
      } catch {
        // Fall through
      }
    }

    // 2. FRESH CACHE check
    const cached = await pulseCache.get<PulseNewsItem[]>(this.CACHE_KEY_NEWS)
    if (cached && cached.length > 0) {
      return {
        items: cached,
        label: 'Em cache',
        live: false,
        fetchedAt: now,
        sourceState: 'fresh-cache',
      }
    }

    // 3. STALE CACHE fallback check
    const stale = await pulseCache.getStaleFallback<PulseNewsItem[]>(this.CACHE_KEY_NEWS)
    if (stale && stale.data && stale.data.length > 0) {
      return {
        items: stale.data,
        label: 'Em cache',
        live: false,
        fetchedAt: now,
        sourceState: 'stale-cache',
      }
    }

    // 4. CURATED FALLBACK
    return {
      items: FALLBACK_NEWS,
      label: 'Curado',
      live: false,
      fetchedAt: now,
      sourceState: 'curated',
    }
  }

  async getTrends(): Promise<PulseBlockResult<PulseTrendItem>> {
    const now = new Date().toISOString()
    return {
      items: FALLBACK_TRENDS,
      label: 'Curado',
      live: false,
      fetchedAt: now,
      sourceState: 'curated',
    }
  }

  async getTech(): Promise<PulseBlockResult<PulseTechItem>> {
    const now = new Date().toISOString()
    return {
      items: FALLBACK_TECH,
      label: 'Curado',
      live: false,
      fetchedAt: now,
      sourceState: 'curated',
    }
  }

  async getRadar(): Promise<PulseBlockResult<PulseRadarItem>> {
    const now = new Date().toISOString()
    return {
      items: FALLBACK_RADAR,
      label: 'Curado',
      live: false,
      fetchedAt: now,
      sourceState: 'curated',
    }
  }

  async getXara(): Promise<PulseBlockResult<PulseXaraItem>> {
    const now = new Date().toISOString()
    return {
      items: FALLBACK_XARA,
      label: 'Disponível',
      live: false,
      fetchedAt: now,
      sourceState: 'curated',
    }
  }

  async getResourceCards(): Promise<PulseResourceCard[]> {
    return FALLBACK_RESOURCE_CARDS
  }

  async getAllItemsForSearch(): Promise<PulseItem[]> {
    const [v, n, tr, te, r, x] = await Promise.all([
      this.getVideos(),
      this.getNews(),
      this.getTrends(),
      this.getTech(),
      this.getRadar(),
      this.getXara(),
    ])

    return [
      ...v.items,
      ...n.items,
      ...tr.items,
      ...te.items,
      ...r.items,
      ...x.items,
    ]
  }

  async getHealthReport(): Promise<PulseSourceHealthRecord[]> {
    const ytHealth = await youtubeLiveSource.health()
    const newsHealth = await newsFeedLiveSource.health()

    const fallbackHealth: PulseSourceHealthRecord = {
      sourceId: 'src-manual-curation',
      sourceName: 'XPeX Curated Fallback Foundation',
      kind: 'manual-curation',
      status: 'healthy',
      lastFetchAt: new Date().toISOString(),
      lastSuccessfulFetchAt: new Date().toISOString(),
      itemCount:
        FALLBACK_VIDEOS.length +
        FALLBACK_NEWS.length +
        FALLBACK_TRENDS.length +
        FALLBACK_TECH.length +
        FALLBACK_RADAR.length,
    }

    return [ytHealth, newsHealth, fallbackHealth]
  }
}

export const pulseRegistry = new PulseSourceRegistry()
