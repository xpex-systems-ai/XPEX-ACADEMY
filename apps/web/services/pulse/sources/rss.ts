/**
 * XPeX Pulse — Server-Side Trusted News & Feeds Ingestion
 * MISSION: XPEX-PULSE-LIVE-SOURCES-002-HARDENING
 *
 * Ingests authoritative technology/AI news and research feeds.
 * Retains complete source provenance (publisher, domain, canonicalUrl).
 * Normalized to XPeX PulseNewsItem domain contract.
 *
 * Truthfulness:
 * - Dates: Validated via parseDateOrNull. Unparseable/missing dates remain null.
 * - Relative time: Computed from verified timestamps only (no fabricated "Hoje").
 * - Read time: readTimeMinutes is undefined unless supplied by an authentic upstream source.
 *   Derived text length metrics are assigned exclusively to estimatedReadTimeMinutes.
 */

import type {
  PulseLiveSource,
  PulseSourceHealthRecord,
} from './types'
import type { PulseNewsItem } from '@/types/pulse'

export interface ApprovedNewsPublisher {
  id: string
  name: string
  domain: string
  feedUrl: string
  trustLevel: 'official' | 'institutional' | 'curated'
}

export const APPROVED_NEWS_PUBLISHERS: ApprovedNewsPublisher[] = [
  {
    id: 'pub-openai',
    name: 'OpenAI News',
    domain: 'openai.com',
    feedUrl: 'https://openai.com/news/rss.xml',
    trustLevel: 'official',
  },
  {
    id: 'pub-deepmind',
    name: 'Google DeepMind Blog',
    domain: 'deepmind.google',
    feedUrl: 'https://deepmind.google/blog/rss.xml',
    trustLevel: 'official',
  },
  {
    id: 'pub-anthropic',
    name: 'Anthropic Research',
    domain: 'anthropic.com',
    feedUrl: 'https://www.anthropic.com/news/rss.xml',
    trustLevel: 'official',
  },
  {
    id: 'pub-mit',
    name: 'MIT Technology Review',
    domain: 'technologyreview.com',
    feedUrl: 'https://www.technologyreview.com/feed/',
    trustLevel: 'institutional',
  },
]

export function parseDateOrNull(value?: string | null): string | null {
  if (!value || typeof value !== 'string') return null
  const parsed = Date.parse(value.trim())
  if (Number.isNaN(parsed)) return null
  return new Date(parsed).toISOString()
}

export function formatRelativeDate(isoDateString?: string | null): string | undefined {
  if (!isoDateString) return undefined
  const timestamp = Date.parse(isoDateString)
  if (Number.isNaN(timestamp)) return undefined

  const diffMs = Date.now() - timestamp
  if (diffMs < 0) return 'Recente'

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Recente'
  if (diffHours < 24) return `há ${diffHours}h`
  if (diffDays === 1) return 'ontem'
  if (diffDays < 7) return `há ${diffDays} dias`
  return undefined
}

export class NewsFeedLiveSource implements PulseLiveSource<PulseNewsItem> {
  id = 'src-news-feeds'
  name = 'Authoritative AI News Feeds'
  kind = 'rss' as const
  trustLevel = 'institutional' as const
  enabled = true
  refreshStrategy = {
    ttlSeconds: 900, // 15 minutes cache
    timeoutMs: 4000,
  }

  private lastFetchAt: string | null = null
  private lastSuccessfulFetchAt: string | null = null
  private lastItemCount = 0
  private lastError: string | undefined = undefined

  async fetch(): Promise<PulseNewsItem[]> {
    this.lastFetchAt = new Date().toISOString()
    const collected: PulseNewsItem[] = []

    // Fetch from approved public feeds server-side with timeout & fault tolerance
    for (const pub of APPROVED_NEWS_PUBLISHERS) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.refreshStrategy.timeoutMs)

        const res = await fetch(pub.feedUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'XPeX-Pulse-Bot/2.0 (+https://xpex.academy)',
            Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml',
          },
        })
        clearTimeout(timeoutId)

        if (res.ok) {
          const text = await res.text()
          const items = this.parseXmlFeed(text, pub)
          collected.push(...items.slice(0, 2)) // top 2 per publisher
        }
      } catch {
        // Continue to other publishers on individual feed error
      }
    }

    if (collected.length > 0) {
      this.lastSuccessfulFetchAt = new Date().toISOString()
      this.lastItemCount = collected.length
      this.lastError = undefined
      return collected
    }

    this.lastError = 'No live feeds reachable'
    return []
  }

  normalize(raw: unknown): PulseNewsItem | null {
    if (!raw || typeof raw !== 'object') return null
    const item = raw as Partial<PulseNewsItem>
    if (!item.title) return null

    const validDate = parseDateOrNull(item.publishedAt)

    return {
      id: item.id || `news-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: item.title,
      description: item.description || '',
      category: 'news',
      label: 'Atualizado',
      publishedAt: validDate,
      url: item.url || null,
      youtubeId: null,
      source: item.source || 'Fonte Especializada',
      domain: item.domain || 'xpex.academy',
      readTimeMinutes: typeof item.readTimeMinutes === 'number' ? item.readTimeMinutes : undefined,
      estimatedReadTimeMinutes: item.estimatedReadTimeMinutes ?? (item.description ? Math.max(2, Math.min(8, Math.round(item.description.length / 100))) : undefined),
      publishedRelative: formatRelativeDate(validDate),
    }
  }

  /**
   * Safe, lightweight XML parser for RSS/Atom items without external heavy dependencies.
   */
  private parseXmlFeed(xml: string, pub: ApprovedNewsPublisher): PulseNewsItem[] {
    const items: PulseNewsItem[] = []
    const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || []

    for (const block of itemMatches.slice(0, 3)) {
      const titleMatch = block.match(/<title[^>]*>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/title>/i)
      const descMatch = block.match(/<(?:description|summary)[^>]*>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/(?:description|summary)>/i)
      const linkMatch = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || block.match(/href=["'](https?:\/\/[^"']+)["']/i)
      const dateMatch = block.match(/<(?:pubDate|published|updated)[^>]*>([\s\S]*?)<\/(?:pubDate|published|updated)>/i)

      const title = titleMatch ? titleMatch[2].replace(/<[^>]+>/g, '').trim() : null
      const desc = descMatch ? descMatch[2].replace(/<[^>]+>/g, '').trim().substring(0, 180) : ''
      const link = linkMatch ? (linkMatch[1] || linkMatch[0]).trim() : null
      const rawDate = dateMatch ? dateMatch[1].trim() : null
      const pubDate = parseDateOrNull(rawDate)

      if (title) {
        items.push({
          id: `feed-${pub.id}-${Math.abs(this.hashCode(title))}`,
          title,
          description: desc,
          category: 'news',
          label: 'Atualizado',
          publishedAt: pubDate,
          url: link,
          youtubeId: null,
          source: pub.name,
          domain: pub.domain,
          readTimeMinutes: undefined, // Never populate readTimeMinutes from derived text length
          estimatedReadTimeMinutes: Math.max(3, Math.min(8, Math.round((desc.length + title.length) / 50))),
          publishedRelative: formatRelativeDate(pubDate),
        })
      }
    }

    return items
  }

  private hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash |= 0
    }
    return hash
  }

  async health(): Promise<PulseSourceHealthRecord> {
    return {
      sourceId: this.id,
      sourceName: this.name,
      kind: this.kind,
      status: this.lastError && !this.lastSuccessfulFetchAt ? 'degraded' : 'healthy',
      lastFetchAt: this.lastFetchAt,
      lastSuccessfulFetchAt: this.lastSuccessfulFetchAt,
      itemCount: this.lastItemCount,
      errorType: this.lastError,
    }
  }
}

export const newsFeedLiveSource = new NewsFeedLiveSource()
