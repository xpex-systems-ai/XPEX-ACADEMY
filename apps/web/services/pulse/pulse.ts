/**
 * XPeX Pulse V1 — Curated Adapter Layer
 * MISSION: XPEX-PULSE-V1-001
 *
 * V1 Data Strategy (per GX directive):
 *   1. Content already on XPeX platform
 *   2. Internal APIs
 *   3. Approved public sources / RSS APIs
 *   4. YouTube official embed only — no redistribution, no circumvention
 *   5. Never: scraping, fabricated content, inflated metrics
 *
 * Honest label taxonomy enforced: Curado | Atualizado | Disponível | Em cache | Indisponível | Em preparação
 * Personalization requires real AI execution — not shown in V1.
 * Live data labels require genuinely fresh data — not claimed in V1.
 */

import type {
  PulseBlockResult,
  PulseVideoItem,
  PulseNewsItem,
  PulseTrendItem,
  PulseTechItem,
  PulseRadarItem,
  PulseXaraItem,
  PulseItem,
  PulseSearchResult,
} from '@/types/pulse'

// ─── Curated Video Catalog (YouTube official embeds) ──────────────────────────
// These are hand-curated authoritative IA/tech learning videos with stable IDs.
// Label: "Curado" — human-selected, not algorithmically inflated.

const CURATED_VIDEOS: PulseVideoItem[] = [
  {
    id: 'v-001',
    title: 'Como Funciona o ChatGPT — Por Dentro dos LLMs',
    description: 'Uma explicação clara sobre transformers, embeddings e como modelos de linguagem são treinados.',
    category: 'videos',
    label: 'Curado',
    publishedAt: '2024-02-10',
    url: 'https://www.youtube.com/watch?v=wjZofJX0v4M',
    youtubeId: 'wjZofJX0v4M',
    channelName: '3Blue1Brown',
    durationLabel: '27 min',
    source: 'YouTube / 3Blue1Brown',
    thumbnailAlt: 'Visualização animada de redes neurais e transformers',
  },
  {
    id: 'v-002',
    title: 'Introdução ao Aprendizado de Máquina com Python',
    description: 'Fundamentos de ML: regressão, classificação e redes neurais com scikit-learn e TensorFlow.',
    category: 'videos',
    label: 'Curado',
    publishedAt: '2023-11-15',
    url: 'https://www.youtube.com/watch?v=i_LwzRVP7bg',
    youtubeId: 'i_LwzRVP7bg',
    channelName: 'freeCodeCamp.org',
    durationLabel: '4h 23 min',
    source: 'YouTube / freeCodeCamp.org',
    thumbnailAlt: 'Tela de código Python com gráfico de machine learning',
  },
  {
    id: 'v-003',
    title: 'Agentes de IA: O Futuro dos Sistemas Autônomos',
    description: 'Como agentes de IA tomam decisões, usam ferramentas e colaboram em sistemas multiagente.',
    category: 'videos',
    label: 'Curado',
    publishedAt: '2024-05-20',
    url: 'https://www.youtube.com/watch?v=sal78ACtGTc',
    youtubeId: 'sal78ACtGTc',
    channelName: 'Andrej Karpathy',
    durationLabel: '1h 8 min',
    source: 'YouTube / Andrej Karpathy',
    thumbnailAlt: 'Diagrama de sistema multiagente com IA',
  },
  {
    id: 'v-004',
    title: 'Web3 em 100 Dias — Do Zero ao Deploy',
    description: 'Solidity, contratos inteligentes, IPFS e DeFi explicados com exemplos práticos.',
    category: 'videos',
    label: 'Curado',
    publishedAt: '2023-09-01',
    url: 'https://www.youtube.com/watch?v=gyMwXuJrbJQ',
    youtubeId: 'gyMwXuJrbJQ',
    channelName: 'Patrick Collins',
    durationLabel: '32h',
    source: 'YouTube / Patrick Collins',
    thumbnailAlt: 'Logotipos de Ethereum, Solidity e DeFi sobre fundo tecnológico',
  },
]

// ─── Curated News Sources ─────────────────────────────────────────────────────
// Static curated links to authoritative sources.
// Label: "Curado" — honest curation label, not a live data claim, not scraped dynamically in V1.
// In V2, this may be replaced by a backend RSS/API aggregator.

const CURATED_NEWS: PulseNewsItem[] = [
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
// Curated observations — no fake percentage growth labels.
// Direction: 'Em alta' | 'Em observação' | 'Emergindo'

const CURATED_TRENDS: PulseTrendItem[] = [
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

const CURATED_TECH: PulseTechItem[] = [
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
// Internal editorial signals — curated by the XPeX team.

const CURATED_RADAR: PulseRadarItem[] = [
  {
    id: 'r-001',
    title: 'Semana de IA na XPeX — Trilhas Abertas',
    description: 'Conteúdos selecionados pela equipe XPeX para acompanhar o que está em alta no universo da IA.',
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
    title: 'GXEON Copilot — Use para Aprender mais Rápido',
    description: 'Seu assistente de IA integrado à XPeX Academy está pronto para responder dúvidas dos seus cursos.',
    category: 'radar',
    label: 'Disponível',
    publishedAt: null,
    url: '/xpex/gxeon',
    youtubeId: null,
    source: 'XPeX Academy',
  },
]

// ─── XARA Recommendations ─────────────────────────────────────────────────────
// These are static curated items in V1.
// In V2, they will be replaced by real personalized recommendations from the
// GXEON AI Gateway (/xpex/ai-gateway) — never direct browser-to-provider calls.

const CURATED_XARA: PulseXaraItem[] = [
  {
    id: 'x-001',
    title: 'Fundamentos de Python para IA',
    description: 'Uma trilha de aprendizado ideal para quem quer entender a linguagem que move o universo da IA.',
    category: 'xara',
    label: 'Curado',
    publishedAt: null,
    url: '/xpex/trails',
    youtubeId: null,
    source: 'XPeX Academy',
  },
  {
    id: 'x-002',
    title: 'Machine Learning na Prática',
    description: 'Aplique algoritmos clássicos e redes neurais em projetos reais dentro da plataforma XPeX.',
    category: 'xara',
    label: 'Curado',
    publishedAt: null,
    url: '/xpex/courses',
    youtubeId: null,
    source: 'XPeX Academy',
  },
  {
    id: 'x-003',
    title: 'Construindo com APIs de IA',
    description: 'Integre OpenAI, Gemini e outros modelos em aplicações do mundo real com boas práticas de segurança.',
    category: 'xara',
    label: 'Em preparação',
    publishedAt: null,
    url: null,
    youtubeId: null,
    source: 'XPeX Academy',
  },
]

// ─── Public API ───────────────────────────────────────────────────────────────

const NOW = new Date().toISOString()

export async function fetchPulseVideos(): Promise<PulseBlockResult<PulseVideoItem>> {
  return {
    items: CURATED_VIDEOS,
    label: 'Curado',
    live: false,
    fetchedAt: NOW,
  }
}

export async function fetchPulseNews(): Promise<PulseBlockResult<PulseNewsItem>> {
  return {
    items: CURATED_NEWS,
    label: 'Curado',
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
  // V1: curated static content only.
  // V2: call /xpex/ai-gateway for personalized recommendations using accessToken.
  return {
    items: CURATED_XARA,
    label: 'Curado',
    live: false,
    fetchedAt: NOW,
  }
}

export function searchPulse(query: string): PulseSearchResult {
  if (!query.trim()) {
    return { items: [], query, totalCount: 0 }
  }
  const q = query.toLowerCase()
  const all: PulseItem[] = [
    ...CURATED_VIDEOS,
    ...CURATED_NEWS,
    ...CURATED_TRENDS,
    ...CURATED_TECH,
    ...CURATED_RADAR,
    ...CURATED_XARA,
  ]
  const matched = all.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.source?.toLowerCase().includes(q) ?? false)
  )
  return {
    items: matched,
    query,
    totalCount: matched.length,
  }
}
