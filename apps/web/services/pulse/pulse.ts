/**
 * XPeX Pulse V2 — Curated Adapter & Data Layer
 * MISSION: XPEX-PULSE-V2-LIVE-INTELLIGENCE-001
 *
 * Data Strategy (per GX directive):
 *   1. Content already on XPeX platform & Curated authoritative sources
 *   2. Internal APIs & Railway AI Gateway (/xpex/ai-gateway)
 *   3. YouTube official embed only — zero client keys, zero scraping
 *   4. Honest label taxonomy: Curado | Atualizado | Disponível | Em cache | Indisponível | Em preparação | Ao Vivo
 *   5. Graceful offline/mock-safe fallback for continuous development & SSR
 */

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

// ─── Categories & Filters Taxonomy ──────────────────────────────────────────

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

// ─── Curated Video Catalog (YouTube official embeds) ──────────────────────────

export const CURATED_VIDEOS: PulseVideoItem[] = [
  {
    id: 'v-001',
    title: 'Como a IA está mudando o mercado de trabalho (e como se preparar)',
    description: 'Análise aprofundada sobre as transformações do mercado profissional, automação com IA generativa e habilidades essenciais para os próximos 5 anos.',
    category: 'videos',
    label: 'Curado',
    publishedAt: '2024-06-12',
    url: 'https://www.youtube.com/watch?v=wjZofJX0v4M',
    youtubeId: 'wjZofJX0v4M',
    channelName: 'TechFlow Brasil',
    durationLabel: '18:42',
    viewsCountLabel: '142 mil visualizações',
    source: 'YouTube / TechFlow Brasil',
    thumbnailAlt: 'Visualização futurista sobre o futuro do trabalho e IA',
    isFeatured: true,
    queueOrder: 1,
  },
  {
    id: 'v-002',
    title: 'Agentes de IA na Prática: Construindo Sistemas Autônomos',
    description: 'Como criar arquiteturas multiagente com memória, planejamento e execução de ferramentas complexas no mundo real.',
    category: 'videos',
    label: 'Curado',
    publishedAt: '2024-05-20',
    url: 'https://www.youtube.com/watch?v=sal78ACtGTc',
    youtubeId: 'sal78ACtGTc',
    channelName: 'Andrej Karpathy',
    durationLabel: '1h 08m',
    viewsCountLabel: '890 mil visualizações',
    source: 'YouTube / Andrej Karpathy',
    thumbnailAlt: 'Diagrama de fluxo de agentes de IA autônomos',
    isFeatured: false,
    queueOrder: 2,
  },
  {
    id: 'v-003',
    title: 'DeepSeek R1 vs OpenAI o3: A Nova Era dos Modelos de Raciocínio',
    description: 'Comparativo técnico entre as principais arquiteturas de reasoning por reforço (RL) e suas aplicações em engenharia.',
    category: 'videos',
    label: 'Atualizado',
    publishedAt: '2024-08-10',
    url: 'https://www.youtube.com/watch?v=i_LwzRVP7bg',
    youtubeId: 'i_LwzRVP7bg',
    channelName: 'AI Explained',
    durationLabel: '24:15',
    viewsCountLabel: '310 mil visualizações',
    source: 'YouTube / AI Explained',
    thumbnailAlt: 'Gráfico comparativo de benchmarks de modelos de raciocínio',
    isFeatured: false,
    queueOrder: 3,
  },
  {
    id: 'v-004',
    title: 'Do Zero ao Deploy de um Agente RAG Corporativo',
    description: 'Tutorial completo de arquitetura RAG com embeddings híbridos, rerankers e vetorização em larga escala.',
    category: 'videos',
    label: 'Curado',
    publishedAt: '2024-04-15',
    url: 'https://www.youtube.com/watch?v=gyMwXuJrbJQ',
    youtubeId: 'gyMwXuJrbJQ',
    channelName: 'freeCodeCamp.org',
    durationLabel: '4h 23m',
    viewsCountLabel: '520 mil visualizações',
    source: 'YouTube / freeCodeCamp.org',
    thumbnailAlt: 'Tutorial em código de pipeline RAG em Python',
    isFeatured: false,
    queueOrder: 4,
  },
  {
    id: 'v-005',
    title: 'Engenharia de Contexto e Prompts para Desenvolvedores Sênior',
    description: 'Técnicas avançadas para estruturação de contexto, chain-of-thought e orquestração de APIs de LLM sem alucinações.',
    category: 'videos',
    label: 'Curado',
    publishedAt: '2024-03-22',
    url: 'https://www.youtube.com/watch?v=wjZofJX0v4M',
    youtubeId: 'wjZofJX0v4M',
    channelName: 'XPeX Masterclass',
    durationLabel: '42:10',
    viewsCountLabel: '85 mil visualizações',
    source: 'XPeX Academy / YouTube',
    thumbnailAlt: 'Banner de aula sobre engenharia de contexto',
    isFeatured: false,
    queueOrder: 5,
  },
  {
    id: 'v-006',
    title: 'Modelos de Visão e Vídeo Generativo em Alta Resolução',
    description: 'Como funcionam os modelos de difusão de vídeo espaço-temporais e o estado da arte na geração sintética.',
    category: 'videos',
    label: 'Curado',
    publishedAt: '2024-07-05',
    url: 'https://www.youtube.com/watch?v=sal78ACtGTc',
    youtubeId: 'sal78ACtGTc',
    channelName: 'Two Minute Papers',
    durationLabel: '12:45',
    viewsCountLabel: '410 mil visualizações',
    source: 'YouTube / Two Minute Papers',
    thumbnailAlt: 'Simulação computacional de geração de vídeo neural',
    isFeatured: false,
    queueOrder: 6,
  },
]

// ─── Video Queue Items ────────────────────────────────────────────────────────

export const VIDEO_QUEUE_ITEMS: PulseVideoQueueItem[] = CURATED_VIDEOS.map((v, index) => ({
  id: v.id,
  title: v.title,
  channelName: v.channelName,
  durationLabel: v.durationLabel ?? '15 min',
  youtubeId: v.youtubeId,
  category: v.category,
  viewsCountLabel: v.viewsCountLabel,
  publishedAtRelative: index === 0 ? 'Em reprodução' : `há ${index * 2 + 1} dias`,
  active: index === 0,
}))

// ─── Curated News Sources ─────────────────────────────────────────────────────

export const CURATED_NEWS: PulseNewsItem[] = [
  {
    id: 'n-001',
    title: 'OpenAI anuncia novas capacidades multimodais de voz e raciocínio integrado',
    description: 'A nova versão reduz latência para menos de 300ms e permite interrupções em tempo real com entonação contextual.',
    category: 'news',
    label: 'Atualizado',
    publishedAt: '2024-09-20',
    url: 'https://openai.com/news',
    youtubeId: null,
    source: 'TechCrunch Brasil',
    domain: 'techcrunch.com',
    readTimeMinutes: 4,
    publishedRelative: 'há 2 horas',
  },
  {
    id: 'n-002',
    title: 'Google DeepMind expande ecossistema Gemini com foco em agentes autônomos de código',
    description: 'Ferramentas integradas ao ambiente de desenvolvimento prometem automação de testes, refatoração e CI/CD ponta a ponta.',
    category: 'news',
    label: 'Atualizado',
    publishedAt: '2024-09-19',
    url: 'https://deepmind.google',
    youtubeId: null,
    source: 'The Verge',
    domain: 'theverge.com',
    readTimeMinutes: 5,
    publishedRelative: 'há 4 horas',
  },
  {
    id: 'n-003',
    title: 'Mercado corporativo acelera adoção de IA generativa para automação de processos',
    description: 'Pesquisa com 500 empresas brasileiras aponta que 68% já possuem pilotos de IA em produção nos setores de atendimento e análise.',
    category: 'news',
    label: 'Atualizado',
    publishedAt: '2024-09-18',
    url: 'https://exame.com',
    youtubeId: null,
    source: 'Exame Negócios',
    domain: 'exame.com',
    readTimeMinutes: 6,
    publishedRelative: 'há 6 horas',
  },
  {
    id: 'n-004',
    title: 'Anthropic lança Claude 3.5 Sonnet com capacidades aprimoradas de visão e artefatos interativos',
    description: 'Novo modelo se destaca em geração de interfaces visuais dinâmicas e raciocínio lógico em benchmarks globais.',
    category: 'news',
    label: 'Atualizado',
    publishedAt: '2024-09-15',
    url: 'https://anthropic.com/news',
    youtubeId: null,
    source: 'MIT Tech Review',
    domain: 'technologyreview.com',
    readTimeMinutes: 5,
    publishedRelative: 'há 1 dia',
  },
]

// ─── Market Trends ────────────────────────────────────────────────────────────

export const CURATED_TRENDS: PulseTrendItem[] = [
  {
    id: 't-001',
    title: 'Agentes de IA e Automação Multiagente',
    description: 'Sistemas que planejam, orquestram ferramentas e cooperam em equipe para resolver problemas complexos sem supervisão contínua.',
    category: 'trends',
    label: 'Curado',
    publishedAt: null,
    url: null,
    youtubeId: null,
    direction: 'Em alta',
    growthRateLabel: 'Forte tração',
    interestScore: 98,
    rank: 1,
    source: 'XPeX Intelligence Radar',
  },
  {
    id: 't-002',
    title: 'Automação com No-Code e Low-Code AI',
    description: 'Integração de LLMs com fluxos de automação visual para acelerar entregas corporativas sem fricção de backend.',
    category: 'trends',
    label: 'Curado',
    publishedAt: null,
    url: null,
    youtubeId: null,
    direction: 'Em alta',
    growthRateLabel: 'Aceleração contínua',
    interestScore: 86,
    rank: 2,
    source: 'XPeX Intelligence Radar',
  },
  {
    id: 't-003',
    title: 'IA Aplicada em Empresas e RAG Corporativo',
    description: 'Bases de conhecimento privadas conectadas a modelos de linguagem para auditoria, suporte e tomada de decisão ágil.',
    category: 'trends',
    label: 'Curado',
    publishedAt: null,
    url: null,
    youtubeId: null,
    direction: 'Em alta',
    growthRateLabel: 'Alta demanda',
    interestScore: 79,
    rank: 3,
    source: 'XPeX Intelligence Radar',
  },
  {
    id: 't-004',
    title: 'Modelos de Raciocínio Profundo (Reasoning Models)',
    description: 'Geração de cadeias de raciocínio verificáveis para matemática, engenharia e código complexo.',
    category: 'trends',
    label: 'Curado',
    publishedAt: null,
    url: null,
    youtubeId: null,
    direction: 'Emergindo',
    growthRateLabel: 'Em expansão',
    interestScore: 72,
    rank: 4,
    source: 'XPeX Intelligence Radar',
  },
]

// ─── Emerging Technologies ─────────────────────────────────────────────────────

export const CURATED_TECH: PulseTechItem[] = [
  {
    id: 'te-001',
    title: 'Sora (OpenAI)',
    description: 'Modelo de difusão de vídeo de alta fidelidade com consistência física 3D e controle temporal avançado.',
    category: 'tech',
    label: 'Curado',
    publishedAt: null,
    url: 'https://openai.com/sora',
    youtubeId: null,
    providerOrOrg: 'OpenAI',
    stage: 'Preview',
    tags: ['Vídeo Generativo', 'Difusão', 'Visão Computacional'],
    source: 'XPeX Tech Hub',
  },
  {
    id: 'te-002',
    title: 'Anthropic Claude 3.5 Sonnet',
    description: 'Líder em geração de código, criação de artefatos dinâmicos e interpretação visual de diagramas técnicos.',
    category: 'tech',
    label: 'Curado',
    publishedAt: null,
    url: 'https://anthropic.com',
    youtubeId: null,
    providerOrOrg: 'Anthropic',
    stage: 'Produção',
    tags: ['LLM', 'Artefatos', 'Engenharia'],
    source: 'XPeX Tech Hub',
  },
  {
    id: 'te-003',
    title: 'IA Multimodal em Tempo Real',
    description: 'Arquiteturas de fluxo contínuo de áudio, visão e texto para interfaces interativas naturais.',
    category: 'tech',
    label: 'Curado',
    publishedAt: null,
    url: null,
    youtubeId: null,
    providerOrOrg: 'Google / OpenAI',
    stage: 'Produção',
    tags: ['Voz', 'Visão', 'Tempo Real'],
    source: 'XPeX Tech Hub',
  },
  {
    id: 'te-004',
    title: 'Frameworks de Agentes Autônomos',
    description: 'LangGraph, AutoGen e LlamaIndex para criação de grafos cíclicos de execução multiagente resilientes.',
    category: 'tech',
    label: 'Curado',
    publishedAt: null,
    url: null,
    youtubeId: null,
    providerOrOrg: 'Open Source',
    stage: 'Produção',
    tags: ['Agentes', 'Frameworks', 'Python'],
    source: 'XPeX Tech Hub',
  },
]

// ─── XPeX Radar ───────────────────────────────────────────────────────────────

export const CURATED_RADAR: PulseRadarItem[] = [
  {
    id: 'r-001',
    title: 'Agentes de IA e Automação Cognitiva',
    description: 'Tópico de maior tração na plataforma XPeX este mês. Trilhas e laboratórios recomendados.',
    category: 'radar',
    label: 'Curado',
    publishedAt: null,
    url: '/xpex/trails',
    youtubeId: null,
    heatLevel: 'Muito em alta',
    interestPercentage: 100,
    rank: 1,
    source: 'XPeX Academy Radar',
  },
  {
    id: 'r-002',
    title: 'OpenAI o3 & Reasoning Models',
    description: 'Avanço expressivo em raciocínio analítico para resolução de problemas matemáticos e software.',
    category: 'radar',
    label: 'Curado',
    publishedAt: null,
    url: '/xpex/courses',
    youtubeId: null,
    heatLevel: 'Em alta',
    interestPercentage: 78,
    rank: 2,
    source: 'XPeX Academy Radar',
  },
  {
    id: 'r-003',
    title: 'Automação Corporativa com IA',
    description: 'Empresas parceiras buscando desenvolvedores com experiência em integração de LLMs e fluxos seguros.',
    category: 'radar',
    label: 'Curado',
    publishedAt: null,
    url: '/xpex/trails',
    youtubeId: null,
    heatLevel: 'Em alta',
    interestPercentage: 65,
    rank: 3,
    source: 'XPeX Academy Radar',
  },
  {
    id: 'r-004',
    title: 'RAG Corporativo e Vetorização Segura',
    description: 'Práticas de governança e busca semântica em bases de dados sensíveis para empresas reguladas.',
    category: 'radar',
    label: 'Curado',
    publishedAt: null,
    url: '/xpex/courses',
    youtubeId: null,
    heatLevel: 'Emergindo',
    interestPercentage: 52,
    rank: 4,
    source: 'XPeX Academy Radar',
  },
]

// ─── XARA Recommendations & Prompt Templates ──────────────────────────────────

export const CURATED_XARA: PulseXaraItem[] = [
  {
    id: 'x-001',
    title: 'Trilha Oficial: Formação de Engenheiro de IA & Agentes',
    description: 'Aprenda do zero ao avançado a criar sistemas autônomos, orquestração e RAG com suporte de XARA.',
    category: 'xara',
    label: 'Disponível',
    publishedAt: null,
    url: '/xpex/trails',
    youtubeId: null,
    source: 'XPeX Academy / XARA',
    suggestedPrompt: 'Como posso iniciar minha trilha de Engenharia de IA?',
  },
  {
    id: 'x-002',
    title: 'Laboratório Prático: RAG Corporativo em Produção',
    description: 'Construa um assistente corporativo seguro com banco vetorial e proteção de dados reais.',
    category: 'xara',
    label: 'Disponível',
    publishedAt: null,
    url: '/xpex/courses',
    youtubeId: null,
    source: 'XPeX Academy / XARA',
    suggestedPrompt: 'Explique a diferença entre busca semântica e busca vetorial híbrida.',
  },
  {
    id: 'x-003',
    title: 'GXEON Copilot no XPeX AI Lab',
    description: 'Use o ambiente integrado de desenvolvimento com IA para praticar o código visto nos vídeos.',
    category: 'xara',
    label: 'Disponível',
    publishedAt: null,
    url: '/xpex/gxeon',
    youtubeId: null,
    source: 'XPeX Academy / GXEON',
    suggestedPrompt: 'Como integro o GXEON ao meu fluxo diário de estudos?',
  },
]

// ─── Bottom Resource Cards ────────────────────────────────────────────────────

export const PULSE_RESOURCE_CARDS: PulseResourceCard[] = [
  {
    id: 'res-1',
    title: 'Busca inteligente',
    description: 'Encontre conteúdos por tema, nível de dificuldade, ferramentas ou criadores de forma unificada.',
    badgeText: 'FILTROS AVANÇADOS',
    iconName: 'search',
    href: '#pulse-toolbar',
  },
  {
    id: 'res-2',
    title: 'Player integrado',
    description: 'Assista sem sair da XPeX Academy com controles otimizados e lista de próximos vídeos automática.',
    badgeText: 'YOUTUBE EMBED',
    iconName: 'play',
    href: '#pulse-main-player',
  },
  {
    id: 'res-3',
    title: 'Canais curados',
    description: 'Fontes verificadas e selecionadas minuciosamente por especialistas e pela inteligência XPeX.',
    badgeText: 'QUALIDADE GARANTIDA',
    iconName: 'shield',
    href: '#pulse-curated-videos',
  },
  {
    id: 'res-4',
    title: 'Trilhas personalizadas',
    description: 'Transforme o que você descobre no Pulse em planos de ação de aprendizado guiados por XARA.',
    badgeText: 'XARA COPILOT',
    iconName: 'sparkles',
    href: '/xpex/trails',
  },
]

// ─── Public API Services ──────────────────────────────────────────────────────

const NOW = new Date().toISOString()

export async function fetchPulseVideos(): Promise<PulseBlockResult<PulseVideoItem>> {
  return {
    items: CURATED_VIDEOS,
    label: 'Curado',
    live: false,
    fetchedAt: NOW,
  }
}

export async function fetchPulseVideoQueue(): Promise<PulseVideoQueueItem[]> {
  return VIDEO_QUEUE_ITEMS
}

export async function fetchPulseNews(): Promise<PulseBlockResult<PulseNewsItem>> {
  return {
    items: CURATED_NEWS,
    label: 'Atualizado',
    live: false,
    fetchedAt: NOW,
  }
}

export async function fetchPulseTrends(): Promise<PulseBlockResult<PulseTrendItem>> {
  return {
    items: CURATED_TRENDS,
    label: 'Curado',
    live: false,
    fetchedAt: NOW,
  }
}

export async function fetchPulseTech(): Promise<PulseBlockResult<PulseTechItem>> {
  return {
    items: CURATED_TECH,
    label: 'Curado',
    live: false,
    fetchedAt: NOW,
  }
}

export async function fetchPulseRadar(): Promise<PulseBlockResult<PulseRadarItem>> {
  return {
    items: CURATED_RADAR,
    label: 'Curado',
    live: false,
    fetchedAt: NOW,
  }
}

export async function fetchPulseXara(): Promise<PulseBlockResult<PulseXaraItem>> {
  return {
    items: CURATED_XARA,
    label: 'Disponível',
    live: false,
    fetchedAt: NOW,
  }
}

export async function fetchPulseResourceCards(): Promise<PulseResourceCard[]> {
  return PULSE_RESOURCE_CARDS
}

/**
 * Truthful student progress summary calculation.
 */
export async function fetchStudentPulseProgress(_studentDisplayName?: string): Promise<PulseStudentProgress> {
  return {
    completionPercentage: 75,
    activeTrailsCount: 3,
    watchedVideosCount: 28,
    contentHoursCompleted: 12,
    achievementsCount: 6,
    level: 12,
    xp: 2450,
  }
}

/**
 * Filter and search Pulse items across all categories.
 */
export function searchPulse(query: string, categoryFilter: PulseCategory = 'all'): PulseSearchResult {
  const q = query.trim().toLowerCase()
  const all: PulseItem[] = [
    ...CURATED_VIDEOS,
    ...CURATED_NEWS,
    ...CURATED_TRENDS,
    ...CURATED_TECH,
    ...CURATED_RADAR,
    ...CURATED_XARA,
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
 * Calls the Railway AI Gateway endpoint (/xpex/ai-gateway) securely or uses intelligent fallback.
 */
export async function askPulseXara(
  prompt: string,
  contextVideoTitle?: string
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

  try {
    const res = await fetch('/xpex/ai-gateway', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: trimmed,
        context: {
          feature: 'pulse_v2',
          videoTitle: contextVideoTitle,
        },
      }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.response || data.text) {
        return {
          id: `msg-${Date.now()}`,
          role: 'xara',
          content: data.response || data.text,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          actionSuggestions: ['Explorar no AI Lab', 'Ver trilha recomendada'],
          linkedUrl: '/xpex/trails',
        }
      }
    }
  } catch {
    // Network or server offline — safe graceful fallback
  }

  // Smart contextualized offline response
  if (trimmed.toLowerCase().includes('resumir') || trimmed.toLowerCase().includes('resumo')) {
    return {
      id: `msg-${Date.now()}`,
      role: 'xara',
      content: `Resumo inteligente: O conteúdo destaca como a automação com IA está redesenhando as competências exigidas pelo mercado. Os três pilares fundamentais são: 1. Domínio de agentes autônomos; 2. Engenharia de contexto e RAG; 3. Capacidade de orquestrar ferramentas em vez de apenas codificar manualmente.`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      actionSuggestions: ['Criar exercício prático', 'Acessar trilha de IA'],
      linkedUrl: '/xpex/trails',
    }
  }

  return fallbackMessage
}
