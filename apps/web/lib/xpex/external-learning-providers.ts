export type XpexExternalLearningProvider = {
  id: string
  name: string
  area: string
  description: string
  access: string
  language: string
  url: string
  highlight: string
  logoSrc: string
  logoAlt: string
  gxReason: string
  gxPriority: number
  stage: 'fundamentos' | 'construcao' | 'escala'
}

/**
 * Curated official learning destinations used by the XPeX Trails hub.
 *
 * Brand marks are rendered from Simple Icons' SVG CDN using each provider's
 * canonical brand glyph. The learning links themselves always point to the
 * provider's official learning surface.
 *
 * Important: these are outbound integrations to official provider learning
 * surfaces. XPeX does not claim ownership of their content and does not infer
 * completion/progress from third-party platforms without an explicit provider
 * API/OAuth integration.
 */
export const xpexExternalLearningProviders: XpexExternalLearningProvider[] = [
  {
    id: 'openai-academy',
    name: 'OpenAI Academy',
    area: 'IA e agentes',
    description: 'Cursos e recursos oficiais para fundamentos de IA, aplicação no trabalho, agentes e workflows.',
    access: 'Acesso público',
    language: 'Conteúdo internacional',
    url: 'https://academy.openai.com/',
    highlight: 'AI Foundations • Agents and Workflows',
    logoSrc: 'https://cdn.simpleicons.org/openai/FFFFFF',
    logoAlt: 'OpenAI',
    gxReason: 'Aprofundar fundamentos, uso responsável, prompting e agentes com material oficial da OpenAI.',
    gxPriority: 100,
    stage: 'fundamentos',
  },
  {
    id: 'microsoft-learn',
    name: 'Microsoft Learn',
    area: 'IA, Copilot e cloud',
    description: 'Treinamento oficial da Microsoft com módulos autodirigidos de IA, Copilot, Azure e desenvolvimento.',
    access: 'Módulos gratuitos disponíveis',
    language: 'Português disponível',
    url: 'https://learn.microsoft.com/pt-br/training/',
    highlight: 'IA • Copilot • Azure • Desenvolvimento',
    logoSrc: 'https://cdn.simpleicons.org/microsoft/5E5E5E',
    logoAlt: 'Microsoft',
    gxReason: 'Transformar conceitos de IA em produtividade, Copilot, Azure e desenvolvimento com uma trilha estruturada.',
    gxPriority: 92,
    stage: 'fundamentos',
  },
  {
    id: 'aws-skill-builder',
    name: 'AWS Skill Builder',
    area: 'Cloud e IA',
    description: 'Centro oficial da AWS para desenvolver habilidades de nuvem, machine learning, IA generativa e serviços AWS.',
    access: '1.000+ recursos gratuitos',
    language: 'Português disponível',
    url: 'https://aws.amazon.com/pt/training/digital/',
    highlight: 'Cloud • GenAI • ML • Agentic AI',
    logoSrc: 'https://cdn.simpleicons.org/amazonwebservices/FF9900',
    logoAlt: 'AWS',
    gxReason: 'Avançar para infraestrutura, serviços gerenciados e implantação de soluções de IA em nuvem.',
    gxPriority: 78,
    stage: 'escala',
  },
  {
    id: 'google-ai-learning',
    name: 'Grow with Google',
    area: 'IA e produtividade',
    description: 'Recursos oficiais do Google para habilidades de IA, produtividade, carreira e ferramentas digitais.',
    access: 'Recursos gratuitos disponíveis',
    language: 'Português disponível',
    url: 'https://grow.google/intl/pt/courses-and-tools/',
    highlight: 'IA • Gemini • Produtividade • Carreira',
    logoSrc: 'https://cdn.simpleicons.org/google/4285F4',
    logoAlt: 'Google',
    gxReason: 'Complementar a base de IA com Gemini, produtividade e aplicações práticas para estudo e carreira.',
    gxPriority: 88,
    stage: 'fundamentos',
  },
  {
    id: 'github-learn',
    name: 'GitHub Learn',
    area: 'Git, GitHub e desenvolvimento',
    description: 'Aprendizado oficial e prático para GitHub, colaboração, automação e fluxos de desenvolvimento.',
    access: 'Acesso público',
    language: 'Conteúdo internacional',
    url: 'https://skills.github.com/',
    highlight: 'GitHub • Actions • Copilot • Dev workflows',
    logoSrc: 'https://cdn.simpleicons.org/github/FFFFFF',
    logoAlt: 'GitHub',
    gxReason: 'Praticar engenharia moderna, versionamento, automação e colaboração em projetos reais.',
    gxPriority: 84,
    stage: 'construcao',
  },
  {
    id: 'vercel-academy',
    name: 'Vercel Academy',
    area: 'Next.js, deploy e AI SDK',
    description: 'Cursos oficiais e práticos sobre Vercel, Next.js, Turborepo, AI SDK e construção de aplicações modernas.',
    access: 'Acesso público',
    language: 'Conteúdo internacional',
    url: 'https://vercel.com/academy',
    highlight: 'Next.js • Vercel • AI SDK • Agents',
    logoSrc: 'https://cdn.simpleicons.org/vercel/FFFFFF',
    logoAlt: 'Vercel',
    gxReason: 'Levar projetos de IA para aplicações web modernas, deploy e experiências com AI SDK.',
    gxPriority: 80,
    stage: 'construcao',
  },
  {
    id: 'notion-academy',
    name: 'Notion Academy',
    area: 'Produtividade e workflows',
    description: 'Hub oficial de aprendizagem do Notion com cursos autodirigidos, fluxos de trabalho, selos e conteúdos em português.',
    access: 'Hub de aprendizado gratuito',
    language: 'Português disponível',
    url: 'https://www.notion.com/pt/help',
    highlight: 'Notion • Workflows • Produtividade • IA',
    logoSrc: 'https://cdn.simpleicons.org/notion/FFFFFF',
    logoAlt: 'Notion',
    gxReason: 'Organizar conhecimento, documentação e fluxos pessoais para transformar estudo em execução consistente.',
    gxPriority: 64,
    stage: 'construcao',
  },
  {
    id: 'canva-design-school',
    name: 'Canva Design School',
    area: 'Design, comunicação e IA',
    description: 'Cursos e aulas oficiais sobre design, comunicação visual, produtividade criativa e recursos de IA do Canva.',
    access: 'Cursos gratuitos e premium',
    language: 'Português disponível',
    url: 'https://www.canva.com/pt_br/design-school/explore/',
    highlight: 'Design • IA • Branding • Conteúdo',
    logoSrc: 'https://cdn.simpleicons.org/canva/00C4CC',
    logoAlt: 'Canva',
    gxReason: 'Desenvolver apresentação, comunicação e design para transformar projetos técnicos em portfólio profissional.',
    gxPriority: 60,
    stage: 'escala',
  },
]

export function getGxTrailRecommendations(progressPercent: number) {
  const preferredStage = progressPercent < 25 ? 'fundamentos' : progressPercent < 70 ? 'construcao' : 'escala'
  const sameStage = xpexExternalLearningProviders.filter(provider => provider.stage === preferredStage)
  const fallback = xpexExternalLearningProviders.filter(provider => provider.stage !== preferredStage)

  return [...sameStage, ...fallback]
    .sort((a, b) => b.gxPriority - a.gxPriority)
    .slice(0, 3)
}
