/**
 * XPeX Pulse — In-Memory & Provider-Neutral Cache Layer
 * MISSION: XPEX-PULSE-LIVE-SOURCES-001
 *
 * Provides SSR-safe caching with variable TTLs and honest freshness reporting.
 * Videos: longer cache (e.g. 1h)
 * News: shorter cache (e.g. 15m)
 * Tech/Trends: controlled refresh (e.g. 2h)
 */

import type {
  PulseCacheProvider,
  PulseCacheEntry,
  PulseFreshnessReport,
} from './types'
import type { PulseContentLabel } from '@/types/pulse'

class MemoryPulseCache implements PulseCacheProvider {
  private store = new Map<string, PulseCacheEntry<unknown>>()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.fetchedAt > entry.ttlMs) {
      // Expired, but kept for stale-while-revalidate fallback if needed
      return null
    }

    return entry.data as T
  }

  async getStaleFallback<T>(key: string): Promise<{ data: T; label: PulseContentLabel } | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    return {
      data: entry.data as T,
      label: 'Em cache',
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number,
    label: PulseContentLabel = 'Atualizado'
  ): Promise<void> {
    this.store.set(key, {
      data: value,
      fetchedAt: Date.now(),
      ttlMs: ttlSeconds * 1000,
      label,
    })
  }

  async invalidate(key: string): Promise<void> {
    this.store.delete(key)
  }

  async getFreshness(key: string): Promise<PulseFreshnessReport | null> {
    const entry = this.store.get(key)
    if (!entry) return null

    const ageMs = Date.now() - entry.fetchedAt
    const isStale = ageMs > entry.ttlMs

    return {
      cached: true,
      ageMs,
      isStale,
      label: isStale ? 'Em cache' : entry.label,
    }
  }

  async clear(): Promise<void> {
    this.store.clear()
  }
}

export const pulseCache = new MemoryPulseCache()
