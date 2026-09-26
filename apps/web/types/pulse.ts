/**
 * XPeX Pulse V2 — Domain Types & Contracts
 * MISSION: XPEX-PULSE-V2-LIVE-INTELLIGENCE-001
 *
 * Truthful, high-density live intelligence & media hub taxonomy.
 * Label taxonomy: Curado | Atualizado | Disponível | Em cache | Indisponível | Em preparação | Ao Vivo
 */

/** Truthful content status labels */
export type PulseContentLabel =
  | 'Curado'
  | 'Atualizado'
  | 'Disponível'
  | 'Em cache'
  | 'Indisponível'
  | 'Em preparação'
  | 'Ao Vivo'

/** Content category taxonomy */
export type PulseCategory =
  | 'all'
  | 'videos'
  | 'news'
  | 'trends'
  | 'tech'
  | 'radar'
  | 'xara'
  | 'ai'
  | 'market'
  | 'tools'
  | 'interviews'
  | 'tutorials'

/** Filter pills representation */
export interface PulseCategoryFilter {
  id: PulseCategory
  label: string
  icon?: string
  count?: number
}

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
  /** Thumbnail image URL or poster */
  thumbnailUrl?: string
  /** Icon/thumbnail description for accessibility */
  thumbnailAlt?: string
  /** Source attribution */
  source?: string
  /** Author or creator name */
  author?: string
}

/** Curated video item (YouTube official embed only) */
export interface PulseVideoItem extends PulseItem {
  category: 'videos'
  youtubeId: string
  channelName: string
  durationLabel?: string
  viewsCountLabel?: string
  isFeatured?: boolean
  queueOrder?: number
}

/** Video queue item */
export interface PulseVideoQueueItem {
  id: string
  title: string
  channelName: string
  durationLabel: string
  youtubeId: string
  thumbnailUrl?: string
  category: string
  viewsCountLabel?: string
  publishedAtRelative?: string
  active?: boolean
}

/** News/update item */
export interface PulseNewsItem extends PulseItem {
  category: 'news'
  domain?: string
  readTimeMinutes?: number
  estimatedReadTimeMinutes?: number
  publishedRelative?: string
}

/** Market trend item */
export interface PulseTrendItem extends PulseItem {
  category: 'trends'
  /** Descriptive direction label — never a fake percentage without qualification */
  direction?: 'Em alta' | 'Em observação' | 'Emergindo'
  growthRateLabel?: string
  interestScore?: number
  rank?: number
}

/** Emerging tech item */
export interface PulseTechItem extends PulseItem {
  category: 'tech'
  tags?: string[]
  providerOrOrg?: string
  stage?: 'Produção' | 'Preview' | 'Pesquisa' | 'Beta'
}

/** XPeX Radar item — curated internal/global signal */
export interface PulseRadarItem extends PulseItem {
  category: 'radar'
  heatLevel?: 'Muito em alta' | 'Em alta' | 'Emergindo' | 'Estável'
  interestPercentage?: number
  rank?: number
}

/** XARA recommendation & interaction contract */
export interface PulseXaraItem extends PulseItem {
  category: 'xara'
  /** Linked course UUID on XPeX platform */
  courseUuid?: string
  /** Linked trail UUID on XPeX platform */
  trailUuid?: string
  /** Contextual action prompt */
  suggestedPrompt?: string
}

/** XARA copilot interaction message */
export interface PulseXaraMessage {
  id: string
  role: 'user' | 'xara' | 'system'
  content: string
  timestamp: string
  actionSuggestions?: string[]
  linkedUrl?: string
}

/** Student learning progress summary */
export interface PulseStudentProgress {
  completionPercentage: number
  activeTrailsCount: number
  watchedVideosCount: number
  contentHoursCompleted: number
  achievementsCount: number
  level: number
  xp: number
}

/** Bottom Resource card contract */
export interface PulseResourceCard {
  id: string
  title: string
  description: string
  badgeText: string
  iconName: string
  href?: string
}

/** Unified block response shape */
export interface PulseBlockResult<T extends PulseItem> {
  items: T[]
  label: PulseContentLabel
  /** True if data came from a live API call in this session */
  live: boolean
  /** ISO timestamp of the last known data refresh */
  fetchedAt: string
  /** Source state for observability and truthful UI indicators */
  sourceState?: 'live' | 'fresh-cache' | 'stale-cache' | 'curated' | 'unavailable'
  /** Age of cached data in milliseconds if retrieved from cache */
  freshnessAgeMs?: number
}

/** Search result */
export interface PulseSearchResult {
  items: PulseItem[]
  query: string
  totalCount: number
  matchedCategory?: PulseCategory
}
