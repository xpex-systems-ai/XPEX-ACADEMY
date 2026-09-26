/**
 * XPeX Pulse — Hybrid Cache Layer (L1 Memory + Pluggable L2 Shared)
 * MISSION: XPEX-PULSE-LIVE-SOURCES-002
 *
 * Architecture & Truthfulness:
 * - L1 (MemoryPulseCache): Ultra-fast, process-local memory cache. In serverless/SSR environments,
 *   this is best-effort per instance and is safely resilient against cold starts.
 * - L2 (SharedPulseCache): Pluggable distributed cache (e.g. Redis / KV) for multi-replica fleets.
 *   Gracefully no-ops when external cache environment is unconfigured.
 * - HybridPulseCache: Orchestrates L1 read-through with L2 fallback, providing high resilience
 *   and graceful degradation under network partitions.
 *
 * Variable TTLs:
 * - Videos: 1 hour (3600s)
 * - News: 15 minutes (900s)
 * - Tech/Trends: 2 hours (7200s)
 */

import 'server-only'

import type {
  PulseCacheProvider,
  PulseCacheEntry,
  PulseFreshnessReport,
} from './types'
import type { PulseContentLabel } from '@/types/pulse'

export class MemoryPulseCache implements PulseCacheProvider {
  private store = new Map<string, PulseCacheEntry<unknown>>()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.fetchedAt > entry.ttlMs) {
      // Expired for fresh reads, kept for stale-while-revalidate fallback
      return null
    }

    return entry.data as T
  }

  async getStaleFallback<T>(key: string): Promise<{ data: T; label: PulseContentLabel; ageMs: number } | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    return {
      data: entry.data as T,
      label: 'Em cache',
      ageMs: Date.now() - entry.fetchedAt,
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

/**
 * Pluggable L2 Shared Cache Provider interface/stub.
 * Ready for Redis / Cloud KV connection strings when provisioned.
 */
export class SharedPulseCache implements PulseCacheProvider {
  private isConfigured = false

  constructor() {
    if (typeof process !== 'undefined' && process.env?.REDIS_URL) {
      this.isConfigured = true
    }
  }

  async get<T>(_key: string): Promise<T | null> {
    if (!this.isConfigured) return null
    // External distributed cache driver implementation goes here
    return null
  }

  async getStaleFallback<T>(_key: string): Promise<{ data: T; label: PulseContentLabel; ageMs: number } | null> {
    if (!this.isConfigured) return null
    return null
  }

  async set<T>(_key: string, _value: T, _ttlSeconds: number, _label?: PulseContentLabel): Promise<void> {
    if (!this.isConfigured) return
  }

  async invalidate(_key: string): Promise<void> {
    if (!this.isConfigured) return
  }

  async getFreshness(_key: string): Promise<PulseFreshnessReport | null> {
    return null
  }

  async clear(): Promise<void> {
    if (!this.isConfigured) return
  }
}

/**
 * Hybrid Cache orchestrating L1 (local memory) and L2 (shared/remote).
 */
export class HybridPulseCache implements PulseCacheProvider {
  private l1: MemoryPulseCache
  private l2: SharedPulseCache

  constructor(l1?: MemoryPulseCache, l2?: SharedPulseCache) {
    this.l1 = l1 ?? new MemoryPulseCache()
    this.l2 = l2 ?? new SharedPulseCache()
  }

  async get<T>(key: string): Promise<T | null> {
    // 1. Try L1 memory cache
    const l1Data = await this.l1.get<T>(key)
    if (l1Data !== null) return l1Data

    // 2. Try L2 shared cache
    const l2Data = await this.l2.get<T>(key)
    if (l2Data !== null) {
      // Backfill L1
      await this.l1.set(key, l2Data, 300, 'Em cache')
      return l2Data
    }

    return null
  }

  async getStaleFallback<T>(key: string): Promise<{ data: T; label: PulseContentLabel } | null> {
    const l1Stale = await this.l1.getStaleFallback<T>(key)
    if (l1Stale !== null) {
      return { data: l1Stale.data, label: l1Stale.label }
    }

    const l2Stale = await this.l2.getStaleFallback<T>(key)
    if (l2Stale !== null) {
      return { data: l2Stale.data, label: l2Stale.label }
    }

    return null
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number,
    label: PulseContentLabel = 'Atualizado'
  ): Promise<void> {
    await Promise.allSettled([
      this.l1.set(key, value, ttlSeconds, label),
      this.l2.set(key, value, ttlSeconds, label),
    ])
  }

  async invalidate(key: string): Promise<void> {
    await Promise.allSettled([
      this.l1.invalidate(key),
      this.l2.invalidate(key),
    ])
  }

  async getFreshness(key: string): Promise<PulseFreshnessReport | null> {
    return this.l1.getFreshness(key)
  }

  async clear(): Promise<void> {
    await Promise.allSettled([
      this.l1.clear(),
      this.l2.clear(),
    ])
  }
}

export const pulseCache = new HybridPulseCache()
