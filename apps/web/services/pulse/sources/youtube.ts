/**
 * XPeX Pulse — Server-Side YouTube Live Discovery Adapter
 * MISSION: XPEX-PULSE-RELEASE-PATCH-001
 *
 * Discovers approved YouTube learning content via official API when configured.
 * Does NOT proxy streams or download media.
 * Uses official embed IDs and youtube-nocookie.com.
 * Gracefully degrades if YOUTUBE_API_KEY is missing or disabled.
 *
 * Trust Model & Exact Matching:
 * - Approved channels matched strictly by exact channelId or exact normalized channelTitle.
 * - Substring matching is strictly rejected.
 * - Non-approved channels are rejected during normalization.
 * - Dates are parsed safely via parseYouTubeDateOrNull (returns null on malformed dates).
 * - Never fabricates duration or view metrics.
 */

import type {
  PulseLiveSource,
  PulseSourceHealthRecord,
  PulseSourceTrustLevel,
} from './types'
import type { PulseVideoItem } from '@/types/pulse'

export interface ApprovedYouTubeChannel {
  channelId?: string
  channelTitle: string
  trustLevel: 'official' | 'institutional' | 'curated'
}

export const APPROVED_YOUTUBE_CHANNELS: ApprovedYouTubeChannel[] = [
  { channelId: 'UCsM1Z5hYQ7eY6X5B_x8Wcug', channelTitle: 'Google DeepMind', trustLevel: 'official' },
  { channelId: 'UCXZCJLdBC09xxGZ6gcdrc6A', channelTitle: 'OpenAI', trustLevel: 'official' },
  { channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw', channelTitle: 'Anthropic', trustLevel: 'official' },
  { channelId: 'UCsMica-v34IrmSK3fG6WkJw', channelTitle: 'Microsoft Developer', trustLevel: 'official' },
  { channelId: 'UCEBb1b_L6zDS3xTUrIALZOw', channelTitle: 'MIT OpenCourseWare', trustLevel: 'institutional' },
  { channelId: 'UC-enRRXlky02Vb_GcxN5e9Q', channelTitle: 'Stanford Online', trustLevel: 'institutional' },
  { channelTitle: 'XPeX Academy', trustLevel: 'official' },
  { channelId: 'UC8butISFwT-Wl7EV0hUK0BQ', channelTitle: 'freeCodeCamp.org', trustLevel: 'curated' },
  { channelId: 'UCsBjURrP6874ICbLq75H97Q', channelTitle: 'Fireship', trustLevel: 'curated' },
  { channelId: 'UCbfYPyITQ-BRhECbknY2hUA', channelTitle: 'Two Minute Papers', trustLevel: 'curated' },
  { channelId: 'UCSHZKyawb77ixDdsGog4iWA', channelTitle: 'Lex Fridman', trustLevel: 'curated' },
  { channelId: 'UCZHmQk67mSJgfCCTTDtxFxA', channelTitle: 'Yannic Kilcher', trustLevel: 'curated' },
]

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

export function parseYouTubeDateOrNull(value?: string | null): string | null {
  if (!value || typeof value !== 'string') return null
  const parsed = Date.parse(value.trim())
  if (Number.isNaN(parsed)) return null
  return new Date(parsed).toISOString()
}

export function resolveYouTubeChannelTrust(
  channelTitle?: string,
  channelId?: string
): {
  trustLevel: PulseSourceTrustLevel
  isApproved: boolean
  matchedChannel?: ApprovedYouTubeChannel
} {
  const titleLower = channelTitle?.toLowerCase().trim()
  const idTrimmed = channelId?.trim()

  if (!titleLower && !idTrimmed) {
    return { trustLevel: 'curated', isApproved: false }
  }

  const matched = APPROVED_YOUTUBE_CHANNELS.find((c) => {
    // 1. Exact channelId matching if channelId is present
    if (idTrimmed && c.channelId && idTrimmed === c.channelId) {
      return true
    }
    // 2. Exact normalized title matching (no substring/partial match)
    if (titleLower && titleLower === c.channelTitle.toLowerCase().trim()) {
      return true
    }
    return false
  })

  if (matched) {
    return { trustLevel: matched.trustLevel, isApproved: true, matchedChannel: matched }
  }

  return { trustLevel: 'curated', isApproved: false }
}

export class YouTubeLiveSource implements PulseLiveSource<PulseVideoItem> {
  id = 'src-youtube-live'
  name = 'YouTube Official Live Discovery'
  kind = 'youtube' as const
  trustLevel: PulseSourceTrustLevel = 'curated'
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
        channelId?: string
        publishedAt?: string
        thumbnails?: { high?: { url?: string }; medium?: { url?: string } }
      }
    }

    const videoId = obj.id?.videoId
    if (!videoId) return null

    const snippet = obj.snippet || {}
    const channelTitle = snippet.channelTitle || ''
    const channelId = snippet.channelId || ''
    const trustInfo = resolveYouTubeChannelTrust(channelTitle, channelId)

    // Enforce strict channel trust filter: only allow exact-matched approved channels
    if (!trustInfo.isApproved) {
      return null
    }

    const publishedAt = parseYouTubeDateOrNull(snippet.publishedAt)

    return {
      id: `yt-live-${videoId}`,
      title: snippet.title || 'Vídeo de IA Recomendado',
      description: snippet.description || '',
      category: 'videos',
      label: 'Atualizado',
      publishedAt,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      youtubeId: videoId,
      channelName: channelTitle || 'Canal Curado',
      durationLabel: undefined, // left undefined if not supplied by search endpoint
      viewsCountLabel: undefined, // never invent fake views
      source: `YouTube / ${channelTitle || 'Canal Curado'}`,
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
