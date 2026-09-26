/**
 * XPeX Pulse — Unified Intelligence & Media Service
 * MISSION: XPEX-PULSE-LIVE-SOURCES-001
 *
 * Integrates the Live Source Fabric with honest labeling taxonomy:
 * Labels: Curado | Atualizado | Disponível | Em cache | Indisponível | Em preparação | Ao Vivo
 * Priority: LIVE -> RECENT CACHE -> CURATED FALLBACK -> EMPTY STATE.
 * Zero client secrets, server-side external adapters, SSR-safe.
 */

import { pulseRegistry } from './sources/registry'
import {
  FALLBACK_VIDEOS,
  FALLBACK_QUEUE_ITEMS,
  FALLBACK_NEWS,
  FALLBACK_TRENDS,
  FALLBACK_TECH,
  FALLBACK_RADAR,
  FALLBACK_XARA,
  FALLBACK_RESOURCE_CARDS,
} from './sources/fallback'
import { startRAGChatStream } from '@services/ai/ai'
import type {
  PulseBlockResult,
  PulseVideoItem,
  PulseVideoQueueItem,
  PulseNewsItem,
  PulseTrendItem,
  PulseTechItem,
  PulseRadarItem,
  PulseXaraItem,
  PulseItem,
  PulseSearchResult,
  PulseCategory,
  PulseCategoryFilter,
  PulseStudentProgress,
  PulseResourceCard,
  PulseXaraMessage,
} from '@/types/pulse'
import type { PulseSourceHealthRecord } from './sources/types'

// Re-export static datasets for backwards compatibility and offline test coverage
export const CURATED_VIDEOS = FALLBACK_VIDEOS
export const VIDEO_QUEUE_ITEMS = FALLBACK_QUEUE_ITEMS
export const CURATED_NEWS = FALLBACK_NEWS
export const CURATED_TRENDS = FALLBACK_TRENDS
export const CURATED_TECH = FALLBACK_TECH
export const CURATED_RADAR = FALLBACK_RADAR
export const CURATED_XARA = FALLBACK_XARA
export const PULSE_RESOURCE_CARDS = FALLBACK_RESOURCE_CARDS

export const PULSE_CATEGORIES: PulseCategoryFilter[] = [
  { id: 'all', label: 'Todos', count: 28 },
  { id: 'ai', label: 'Inteligência Artificial', count: 14 },
  { id: 'market', label: 'Mercado e Negócios', count: 8 },
  { id: 'tools', label: 'Ferramentas e Demos', count: 9 },
  { id: 'news', label: 'Notícias', count: 6 },
  { id: 'interviews', label: 'Entrevistas', count: 4 },
  { id: 'tutorials', label: 'Tutoriais', count: 11 },
  { id: 'xara', label: 'GXEON & XARA', count: 5 },
]

// ─── Public Async Fetchers (Powered by Registry) ─────────────────────────────

export async function fetchPulseVideos(liveSourcesEnabled = false): Promise<PulseBlockResult<PulseVideoItem>> {
  return pulseRegistry.getVideos(liveSourcesEnabled)
}

export async function fetchPulseVideoQueue(liveSourcesEnabled = false): Promise<PulseVideoQueueItem[]> {
  return pulseRegistry.getVideoQueue(liveSourcesEnabled)
}

export async function fetchPulseNews(liveSourcesEnabled = false): Promise<PulseBlockResult<PulseNewsItem>> {
  return pulseRegistry.getNews(liveSourcesEnabled)
}

export async function fetchPulseTrends(): Promise<PulseBlockResult<PulseTrendItem>> {
  return pulseRegistry.getTrends()
}

export async function fetchPulseTech(): Promise<PulseBlockResult<PulseTechItem>> {
  return pulseRegistry.getTech()
}

export async function fetchPulseRadar(): Promise<PulseBlockResult<PulseRadarItem>> {
  return pulseRegistry.getRadar()
}

export async function fetchPulseXara(): Promise<PulseBlockResult<PulseXaraItem>> {
  return pulseRegistry.getXara()
}

export async function fetchPulseResourceCards(): Promise<PulseResourceCard[]> {
  return pulseRegistry.getResourceCards()
}

export async function getPulseSourcesHealth(): Promise<PulseSourceHealthRecord[]> {
  return pulseRegistry.getHealthReport()
}

/**
 * Truthful student progress summary calculation.
 */
export async function fetchStudentPulseProgress(_studentDisplayName?: string): Promise<PulseStudentProgress | undefined> {
  // Academic progress remains authoritative in the student-learning backend.
  // Until that source is wired into Pulse, return no synthetic metrics.
  return undefined
}

/**
 * Filter and search Pulse items across all registered sources.
 */
export function searchPulse(query: string, categoryFilter: PulseCategory = 'all'): PulseSearchResult {
  const q = query.trim().toLowerCase()
  const all: PulseItem[] = [
    ...FALLBACK_VIDEOS,
    ...FALLBACK_NEWS,
    ...FALLBACK_TRENDS,
    ...FALLBACK_TECH,
    ...FALLBACK_RADAR,
    ...FALLBACK_XARA,
  ]

  let filtered = all
  if (categoryFilter !== 'all') {
    filtered = all.filter((item) => {
      if (categoryFilter === 'videos') return item.category === 'videos'
      if (categoryFilter === 'news') return item.category === 'news'
      if (categoryFilter === 'trends') return item.category === 'trends'
      if (categoryFilter === 'tech') return item.category === 'tech'
      if (categoryFilter === 'radar') return item.category === 'radar'
      if (categoryFilter === 'xara') return item.category === 'xara'
      if (categoryFilter === 'ai') {
        return (
          item.title.toLowerCase().includes('ia') ||
          item.description.toLowerCase().includes('ia') ||
          item.title.toLowerCase().includes('ai')
        )
      }
      if (categoryFilter === 'market') {
        return (
          item.title.toLowerCase().includes('mercado') ||
          item.description.toLowerCase().includes('mercado') ||
          item.title.toLowerCase().includes('empresas')
        )
      }
      if (categoryFilter === 'tools' || categoryFilter === 'tutorials') {
        return (
          item.title.toLowerCase().includes('prática') ||
          item.title.toLowerCase().includes('tutorial') ||
          item.title.toLowerCase().includes('deploy') ||
          item.category === 'tech'
        )
      }
      return true
    })
  }

  if (!q) {
    return {
      items: filtered,
      query,
      totalCount: filtered.length,
      matchedCategory: categoryFilter,
    }
  }

  const matched = filtered.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.source?.toLowerCase().includes(q) ?? false) ||
      (item.author?.toLowerCase().includes(q) ?? false)
  )

  return {
    items: matched,
    query,
    totalCount: matched.length,
    matchedCategory: categoryFilter,
  }
}

/**
 * XARA AI Bridge Dispatcher
 * Dispatches through the authenticated RAG/GXEON streaming client (startRAGChatStream) or provides contextual fallback.
 */
export async function askPulseXara(
  prompt: string,
  contextVideoTitle?: string,
  accessToken?: string,
  orgSlug?: string
): Promise<PulseXaraMessage> {
  const trimmed = prompt.trim()
  const fallbackMessage: PulseXaraMessage = {
    id: `msg-${Date.now()}`,
    role: 'xara',
    content: contextVideoTitle
      ? `Com base no conteúdo "${contextVideoTitle}": Acelere seu aprendizado conectando este conceito à sua trilha prática no XPeX AI Lab. Deseja que eu elabore um resumo dos pontos-chave ou crie um exercício prático?`
      : `Olá! Sou a XARA, sua mentora de IA na XPeX Academy. Estou pronta para ajudá-lo a conectar tendências, vídeos e projetos em um plano de estudo prático. O que gostaria de explorar agora?`,
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    actionSuggestions: [
      'Resumir este conteúdo',
      'Criar trilha personalizada',
      'Sugerir próximos vídeos',
    ],
    linkedUrl: '/xpex/trails',
  }

  if (!trimmed) {
    return fallbackMessage
  }

  if (accessToken) {
    try {
      let accumulated = ''
      await startRAGChatStream(
        contextVideoTitle ? `[Contexto Pulse: ${contextVideoTitle}] ${trimmed}` : trimmed,
        accessToken,
        {
          onChunk: (chunk: string) => {
            accumulated += chunk
          },
          onComplete: () => {},
          onError: () => {},
        },
        undefined,
        'pulse_copilot',
        orgSlug
      )

      if (accumulated.trim()) {
        return {
          id: `msg-${Date.now()}`,
          role: 'xara',
          content: accumulated.trim(),
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          actionSuggestions: ['Explorar no AI Lab', 'Ver trilha recomendada'],
          linkedUrl: '/xpex/trails',
        }
      }
    } catch {
      // Offline / fallback path
    }
  }

  // Do not fabricate summaries when GXEON is unavailable.
  if (trimmed.toLowerCase().includes('resumir') || trimmed.toLowerCase().includes('resumo')) {
    return {
      id: `msg-${Date.now()}`,
      role: 'system',
      content: 'A XARA não conseguiu acessar o GXEON para resumir este conteúdo agora. O vídeo continua disponível normalmente e você pode tentar novamente em instantes.',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      actionSuggestions: ['Tentar novamente', 'Abrir GXEON Copilot'],
      linkedUrl: '/xpex/gxeon',
    }
  }

  return fallbackMessage
}
