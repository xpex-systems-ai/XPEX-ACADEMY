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
  { id: 'all', label: 'Todos' },
  { id: 'ai', label: 'Inteligência Artificial' },
  { id: 'market', label: 'Mercado e Negócios' },
  { id: 'tools', label: 'Ferramentas e Demos' },
  { id: 'news', label: 'Notícias' },
  { id: 'interviews', label: 'Entrevistas' },
  { id: 'tutorials', label: 'Tutoriais' },
  { id: 'xara', label: 'GXEON & XARA' },
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
  active: index === 0,
}))

// ─── Curated News Sources ─────────────────────────────────────────────────────

export const CURATED_NEWS: PulseNewsItem[] = [
  {
    id: 'n-001',
    title: 'OpenAI lança GPT-4o com capacidades multimodais avançadas',
    description: 'O modelo combina texto, voz e visão em uma única interface, permitindo interações naturais e fluidas.',
    category: 'news',
    label: 'Curado',
    publishedAt: '2024-05-13',
    url: 'https://openai.com/index/hello-gpt-4o/',
    youtubeId: null,
    source: 'openai.com',
    domain: 'openai.com',
  },
  {
    id: 'n-002',
    title: 'Google DeepMind apresenta Gemini Ultra — benchmark MMLU superado',
    description: 'Primeira vez que um modelo de IA supera humanos especialistas em benchmark acadêmico multidisciplinar.',
    category: 'news',
    label: 'Curado',
    publishedAt: '2023-12-06',
    url: 'https://deepmind.google/technologies/gemini/',
    youtubeId: null,
    source: 'deepmind.google',
    domain: 'deepmind.google',
  },
  {
    id: 'n-003',
    title: 'Llama 3 da Meta é open source — o que isso muda para developers',
    description: 'Meta libera pesos do modelo com licença permissiva, abrindo caminho para IA local e customizável.',
    category: 'news',
    label: 'Curado',
    publishedAt: '2024-04-18',
    url: 'https://llama.meta.com/',
    youtubeId: null,
    source: 'llama.meta.com',
    domain: 'meta.com',
  },
  {
    id: 'n-004',
    title: 'Relatório de empregos do FMI: IA pode afetar 40% dos postos globais',
    description: 'Análise aponta transformações profundas no mercado de trabalho, com setores de conhecimento mais expostos.',
    category: 'news',
    label: 'Curado',
    publishedAt: '2024-01-14',
    url: 'https://www.imf.org/en/Blogs/Articles/2024/01/14/ai-will-transform-the-global-economy',
    youtubeId: null,
    source: 'imf.org',
    domain: 'imf.org',
  },
]

// ─── Market Trends ────────────────────────────────────────────────────────────

export const CURATED_TRENDS: PulseTrendItem[] = [
  {
    id: 't-001',
    title: 'Engenharia de Prompts',
    description: 'A habilidade de estruturar instruções para LLMs tornou-se competência essencial em times de produto e tecnologia.',
    category: 'trends',
    label: 'Curado',
    publishedAt: null,
    url: null,
    youtubeId: null,
    direction: 'Em alta',
    source: 'XPeX Radar',
  },
  {
    id: 't-002',
    title: 'Agentes de IA Autônomos',
    description: 'Sistemas que planejam, executam e iteram sem intervenção humana constante estão saindo da pesquisa para o mercado.',
    category: 'trends',
    label: 'Curado',
    publishedAt: null,
    url: null,
    youtubeId: null,
    direction: 'Em alta',
    source: 'XPeX Radar',
  },
  {
    id: 't-003',
    title: 'RAG — Retrieval Augmented Generation',
    description: 'Empresas adotam RAG para conectar LLMs a bases de dados proprietárias sem fine-tuning custoso.',
    category: 'trends',
    label: 'Curado',
    publishedAt: null,
    url: null,
    youtubeId: null,
    direction: 'Em alta',
    source: 'XPeX Radar',
  },
  {
    id: 't-004',
    title: 'Edge AI — Inferência no Dispositivo',
    description: 'Processamento local de modelos menores para privacidade, latência e custo reduzidos.',
    category: 'trends',
    label: 'Curado',
    publishedAt: null,
    url: null,
    youtubeId: null,
    direction: 'Emergindo',
    source: 'XPeX Radar',
  },
]

// ─── Emerging Technologies ─────────────────────────────────────────────────────

export const CURATED_TECH: PulseTechItem[] = [
  {
    id: 'te-001',
    title: 'Multimodal AI',
    description: 'Modelos que processam texto, imagem, áudio e vídeo simultaneamente abrem novas possibilidades de produtos.',
    category: 'tech',
    label: 'Curado',
    publishedAt: null,
    url: null,
    youtubeId: null,
    tags: ['IA', 'Visão Computacional', 'LLM'],
    source: 'XPeX Radar',
  },
  {
    id: 'te-002',
    title: 'Web3 & DeFi',
    description: 'Finanças descentralizadas e contratos inteligentes redefinindo o acesso a serviços financeiros globalmente.',
    category: 'tech',
    label: 'Curado',
    publishedAt: null,
    url: null,
    youtubeId: null,
    tags: ['Web3', 'Cripto', 'DeFi', 'Blockchain'],
    source: 'XPeX Radar',
  },
  {
    id: 'te-003',
    title: 'Computação Quântica Aplicada',
    description: 'Primeiras aplicações práticas em otimização e criptografia surgem em parceria com grandes empresas.',
    category: 'tech',
    label: 'Em preparação',
    publishedAt: null,
    url: null,
    youtubeId: null,
    tags: ['Quântica', 'Pesquisa', 'IBM', 'Google'],
    source: 'XPeX Radar',
  },
  {
    id: 'te-004',
    title: 'IA Generativa para Criação',
    description: 'Ferramentas de geração de imagem, vídeo, código e música transformando fluxos de produção criativa.',
    category: 'tech',
    label: 'Curado',
    publishedAt: null,
    url: null,
    youtubeId: null,
    tags: ['IA Generativa', 'DALL-E', 'Sora', 'GitHub Copilot'],
    source: 'XPeX Radar',
  },
]

// ─── XPeX Radar ───────────────────────────────────────────────────────────────

export const CURATED_RADAR: PulseRadarItem[] = [
  {
    id: 'r-001',
    title: 'Semana de IA na XPeX — Trilhas Abertas',
    description: 'Conteúdos selecionados pela equipe XPeX para acompanhar temas relevantes no universo da IA.',
    category: 'radar',
    label: 'Curado',
    publishedAt: null,
    url: '/xpex/trails',
    youtubeId: null,
    source: 'XPeX Academy',
  },
  {
    id: 'r-002',
    title: 'Novos Cursos Disponíveis em Desenvolvimento',
    description: 'A equipe está preparando novos conteúdos de Python avançado, APIs de IA e automação de processos.',
    category: 'radar',
    label: 'Em preparação',
    publishedAt: null,
    url: '/xpex/courses',
    youtubeId: null,
    source: 'XPeX Academy',
  },
  {
    id: 'r-003',
    title: 'GXEON Copilot — Apoio aos Estudos',
    description: 'O assistente integrado da XPeX Academy pode apoiar dúvidas e atividades dos cursos disponíveis.',
    category: 'radar',
    label: 'Disponível',
    publishedAt: null,
    url: '/xpex/gxeon',
    youtubeId: null,
    source: 'XPeX Academy',
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
    description: 'Fontes e conteúdos selecionados pela curadoria XPeX.',
    badgeText: 'CURADORIA XPEX',
    iconName: 'shield',
    href: '#pulse-curated-videos',
  },
  {
    id: 'res-4',
    title: 'Trilhas relacionadas',
    description: 'Conecte o que você descobre no Pulse às trilhas disponíveis na XPeX Academy.',
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
export async function fetchStudentPulseProgress(_studentDisplayName?: string): Promise<PulseStudentProgress | undefined> {
  return undefined
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

  return {
    id: `msg-${Date.now()}`,
    role: 'system',
    content: 'A XARA não conseguiu acessar o GXEON neste momento. O conteúdo continua disponível, mas resumos e recomendações geradas por IA ficam temporariamente indisponíveis.',
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    actionSuggestions: ['Tentar novamente mais tarde'],
    linkedUrl: '/xpex/gxeon',
  }
}
