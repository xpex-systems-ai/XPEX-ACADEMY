/**
 * XPeX Pulse V1 — Domain Types
 * MISSION: XPEX-PULSE-V1-001
 *
 * Honest, curated content model. No fake data, no inflated metrics.
 * Label taxonomy: Curado | Atualizado | Disponível | Em cache | Indisponível | Em preparação
 */

/** Truthful content status labels */
export type PulseContentLabel =
  | 'Curado'
  | 'Atualizado'
  | 'Disponível'
  | 'Em cache'
  | 'Indisponível'
  | 'Em preparação'

/** Content category taxonomy */
export type PulseCategory =
  | 'videos'
  | 'news'
  | 'trends'
  | 'tech'
  | 'radar'
  | 'xara'

/** Base Pulse item contract */
export interface PulseItem {
  id: string
  title: string
  description: string
  category: PulseCategory
  label: PulseContentLabel
  /** ISO 8601 date string or null if unknown */
  publishedAt: string | null
  /** External URL (YouTube embed, news article, etc.) — null if not yet available */
  url: string | null
  /** YouTube video ID for official embed — null if not a video */
  youtubeId: string | null
  /** Icon/thumbnail description for accessibility */
  thumbnailAlt?: string
  /** Source attribution */
  source?: string
}

/** Curated video item (YouTube official embed only) */
export interface PulseVideoItem extends PulseItem {
  category: 'videos'
  youtubeId: string
  channelName: string
  durationLabel?: string
}

/** News/update item */
export interface PulseNewsItem extends PulseItem {
  category: 'news'
  domain?: string
}

/** Market trend item */
export interface PulseTrendItem extends PulseItem {
  category: 'trends'
  /** Descriptive direction label — never a fake percentage */
  direction?: 'Em alta' | 'Em observação' | 'Emergindo'
}

/** Emerging tech item */
export interface PulseTechItem extends PulseItem {
  category: 'tech'
  tags?: string[]
}

/** XPeX Radar item — curated internal signal */
export interface PulseRadarItem extends PulseItem {
  category: 'radar'
}

/** XARA recommendation — sourced via GXEON gateway only */
export interface PulseXaraItem extends PulseItem {
  category: 'xara'
  /** Linked course UUID on XPeX platform */
  courseUuid?: string
  /** Linked trail UUID on XPeX platform */
  trailUuid?: string
}

/** Unified block response shape */
export interface PulseBlockResult<T extends PulseItem> {
  items: T[]
  label: PulseContentLabel
  /** True if data came from a live API call in this session */
  live: boolean
  /** ISO timestamp of the last known data refresh */
  fetchedAt: string
}

/** Search result */
export interface PulseSearchResult {
  items: PulseItem[]
  query: string
  totalCount: number
}
