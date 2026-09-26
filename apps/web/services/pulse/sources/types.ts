/**
 * XPeX Pulse — Live Source Fabric Types & Contracts
 * MISSION: XPEX-PULSE-LIVE-SOURCES-001
 *
 * Server-side source abstraction, provenance tracking, and health contracts.
 */

import type { PulseItem, PulseContentLabel } from '@/types/pulse'

export type PulseSourceKind =
  | 'youtube'
  | 'rss'
  | 'atom'
  | 'official-api'
  | 'internal'
  | 'cached'
  | 'manual-curation'

export type PulseSourceTrustLevel =
  | 'official'
  | 'partner'
  | 'institutional'
  | 'curated'
  | 'community'

export type PulseSourceHealthStatus =
  | 'healthy'
  | 'degraded'
  | 'cached'
  | 'disabled'
  | 'failed'
  | 'unconfigured'

export interface PulseSourceHealthRecord {
  sourceId: string
  sourceName: string
  kind: PulseSourceKind
  status: PulseSourceHealthStatus
  lastFetchAt: string | null
  lastSuccessfulFetchAt: string | null
  itemCount: number
  errorType?: string
  latencyMs?: number
}

export interface PulseNormalizedItem<T extends PulseItem = PulseItem> {
  item: T
  rawSourceId: string
  sourceKind: PulseSourceKind
  trustLevel: PulseSourceTrustLevel
  fetchedAt: string
  label: PulseContentLabel
  cached: boolean
}

export interface PulseRefreshStrategy {
  ttlSeconds: number
  staleWhileRevalidateSeconds?: number
  maxRetries?: number
  timeoutMs?: number
}

export interface PulseLiveSource<T extends PulseItem = PulseItem> {
  id: string
  name: string
  kind: PulseSourceKind
  trustLevel: PulseSourceTrustLevel
  enabled: boolean
  refreshStrategy: PulseRefreshStrategy
  fetch: () => Promise<T[]>
  normalize: (_raw: unknown) => T | null
  health: () => Promise<PulseSourceHealthRecord>
}

export interface PulseCacheEntry<T> {
  data: T
  fetchedAt: number
  ttlMs: number
  label: PulseContentLabel
}

export interface PulseFreshnessReport {
  cached: boolean
  ageMs: number
  isStale: boolean
  label: PulseContentLabel
}

export interface PulseCacheProvider {
  get: <T>(_key: string) => Promise<T | null>
  set: <T>(_key: string, _value: T, _ttlSeconds: number, _label?: PulseContentLabel) => Promise<void>
  invalidate: (_key: string) => Promise<void>
  getFreshness: (_key: string) => Promise<PulseFreshnessReport | null>
  clear: () => Promise<void>
}
