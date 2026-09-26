/**
 * XPeX Pulse — Server-Side YouTube Live Discovery Adapter
 * MISSION: XPEX-PULSE-LIVE-SOURCES-001
 *
 * Discovers official YouTube learning content via official API when configured.
 * Does NOT proxy streams or download media.
 * Uses official embed IDs and youtube-nocookie.com.
 * Gracefully degrades if YOUTUBE_API_KEY is missing or disabled.
 */

import 'server-only'

import type {
  PulseLiveSource,
  PulseSourceHealthRecord,
} from './types'
import type { PulseVideoItem } from '@/types/pulse'

export const APPROVED_YOUTUBE_TOPICS = [
  'artificial intelligence',
  'generative AI',
  'AI agents',
  'machine learning',
  'AI coding',
  'automation',
  'AI business',
  'AI education',
  'robotics',
  'multimodal AI',
  'open source AI',
  'AI productivity',
]

export class YouTubeLiveSource implements PulseLiveSource<PulseVideoItem> {
  id = 'src-youtube-live'
  name = 'YouTube Official Live Discovery'
  kind = 'youtube' as const
  trustLevel = 'official' as const
  enabled = true
  refreshStrategy = {
    ttlSeconds: 3600, // 1 hour cache
    timeoutMs: 5000,
  }

  private lastFetchAt: string | null = null
  private lastSuccessfulFetchAt: string | null = null
  private lastItemCount = 0
  private lastError: string | undefined = undefined

  private getApiKey(): string | null {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.YOUTUBE_API_KEY || null
    }
    return null
  }

  async fetch(): Promise<PulseVideoItem[]> {
    this.lastFetchAt = new Date().toISOString()
    const apiKey = this.getApiKey()

    if (!apiKey) {
      this.lastError = 'YOUTUBE_API_KEY unconfigured'
      return []
    }

    try {
      // Server-side query to YouTube Data API v3 search
      const query = encodeURIComponent('inteligencia artificial agentes tutorial')
      const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=6&key=${apiKey}`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.refreshStrategy.timeoutMs)

      const res = await fetch(endpoint, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        this.lastError = `HTTP_${res.status}`
        return []
      }

      const data = await res.json()
      if (!data.items || !Array.isArray(data.items)) {
        return []
      }

      const items = data.items
        .map((raw: unknown) => this.normalize(raw))
        .filter((item: PulseVideoItem | null): item is PulseVideoItem => item !== null)

      this.lastSuccessfulFetchAt = new Date().toISOString()
      this.lastItemCount = items.length
      this.lastError = undefined
      return items
    } catch (err: unknown) {
      this.lastError = err instanceof Error ? err.message : 'FETCH_ERROR'
      return []
    }
  }

  normalize(raw: unknown): PulseVideoItem | null {
    if (!raw || typeof raw !== 'object') return null
    const obj = raw as {
      id?: { videoId?: string }
      snippet?: {
        title?: string
        description?: string
        channelTitle?: string
        publishedAt?: string
        thumbnails?: { high?: { url?: string }; medium?: { url?: string } }
      }
    }

    const videoId = obj.id?.videoId
    if (!videoId) return null

    const snippet = obj.snippet || {}

    return {
      id: `yt-live-${videoId}`,
      title: snippet.title || 'Vídeo de IA Recomendado',
      description: snippet.description || '',
      category: 'videos',
      label: 'Atualizado',
      publishedAt: snippet.publishedAt || null,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      youtubeId: videoId,
      channelName: snippet.channelTitle || 'Canal Curado',
      durationLabel: undefined, // left undefined if not supplied by search endpoint
      viewsCountLabel: undefined, // never invent fake views
      source: `YouTube / ${snippet.channelTitle || 'Oficial'}`,
      thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url,
      thumbnailAlt: snippet.title ? `Thumbnail de ${snippet.title}` : undefined,
    }
  }

  async health(): Promise<PulseSourceHealthRecord> {
    const apiKey = this.getApiKey()
    let status: PulseSourceHealthRecord['status'] = 'unconfigured'

    if (!apiKey) {
      status = 'unconfigured'
    } else if (this.lastError) {
      status = 'degraded'
    } else if (this.lastSuccessfulFetchAt) {
      status = 'healthy'
    }

    return {
      sourceId: this.id,
      sourceName: this.name,
      kind: this.kind,
      status,
      lastFetchAt: this.lastFetchAt,
      lastSuccessfulFetchAt: this.lastSuccessfulFetchAt,
      itemCount: this.lastItemCount,
      errorType: this.lastError,
    }
  }
}

export const youtubeLiveSource = new YouTubeLiveSource()
