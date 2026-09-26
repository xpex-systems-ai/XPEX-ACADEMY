/**
 * XPeX Pulse — Cache Layer (L1 Process-Local Memory Cache)
 * MISSION: XPEX-PULSE-LIVE-SOURCES-002-HARDENING
 *
 * Cache Truthfulness & Architecture:
 * - Current Mode: Explicit L1 in-memory process-local cache (MemoryPulseCache).
 * - Serverless/SSR Behavior: Best-effort per instance. State resets on cold starts,
 *   and gracefully falls back to fresh fetch, stale cache, or curated baselines.
 * - Distributed L2: No active Redis/KV client is installed in apps/web. The SharedPulseCache
 *   class is preserved as a pluggable architectural contract stub without claiming active L2.
 *
 * Variable TTLs:
 * - Videos: 1 hour (3600s)
 * - News: 15 minutes (900s)
 * - Tech/Trends: 2 hours (7200s)
 */

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
 * Pluggable L2 Shared Cache Provider interface contract stub.
 * Explicitly unconfigured until a shared distributed driver is provisioned.
 */
export class SharedPulseCache implements PulseCacheProvider {
  readonly isConfigured = false

  async get<T>(_key: string): Promise<T | null> {
    return null
  }

  async getStaleFallback<T>(_key: string): Promise<{ data: T; label: PulseContentLabel; ageMs: number } | null> {
    return null
  }

  async set<T>(_key: string, _value: T, _ttlSeconds: number, _label?: PulseContentLabel): Promise<void> {
    // No-op in L1-only mode
  }

  async invalidate(_key: string): Promise<void> {
    // No-op in L1-only mode
  }

  async getFreshness(_key: string): Promise<PulseFreshnessReport | null> {
    return null
  }

  async clear(): Promise<void> {
    // No-op in L1-only mode
  }
}

/**
 * Hybrid Cache orchestrating L1 (local memory) with optional pluggable L2.
 * In current deployment, runs in deterministic L1-only mode.
 */
export class HybridPulseCache implements PulseCacheProvider {
  private l1: MemoryPulseCache
  private l2: SharedPulseCache

  constructor(l1?: MemoryPulseCache, l2?: SharedPulseCache) {
    this.l1 = l1 ?? new MemoryPulseCache()
    this.l2 = l2 ?? new SharedPulseCache()
  }

  async get<T>(key: string): Promise<T | null> {
    const l1Data = await this.l1.get<T>(key)
    if (l1Data !== null) return l1Data

    if (this.l2.isConfigured) {
      const l2Data = await this.l2.get<T>(key)
      if (l2Data !== null) {
        await this.l1.set(key, l2Data, 300, 'Em cache')
        return l2Data
      }
    }

    return null
  }

  async getStaleFallback<T>(key: string): Promise<{ data: T; label: PulseContentLabel } | null> {
    const l1Stale = await this.l1.getStaleFallback<T>(key)
    if (l1Stale !== null) {
      return { data: l1Stale.data, label: l1Stale.label }
    }

    if (this.l2.isConfigured) {
      const l2Stale = await this.l2.getStaleFallback<T>(key)
      if (l2Stale !== null) {
        return { data: l2Stale.data, label: l2Stale.label }
      }
    }

    return null
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number,
    label: PulseContentLabel = 'Atualizado'
  ): Promise<void> {
    await this.l1.set(key, value, ttlSeconds, label)
    if (this.l2.isConfigured) {
      await this.l2.set(key, value, ttlSeconds, label)
    }
  }

  async invalidate(key: string): Promise<void> {
    await this.l1.invalidate(key)
    if (this.l2.isConfigured) {
      await this.l2.invalidate(key)
    }
  }

  async getFreshness(key: string): Promise<PulseFreshnessReport | null> {
    return this.l1.getFreshness(key)
  }

  async clear(): Promise<void> {
    await this.l1.clear()
    if (this.l2.isConfigured) {
      await this.l2.clear()
    }
  }
}

export const pulseCache = new HybridPulseCache()
