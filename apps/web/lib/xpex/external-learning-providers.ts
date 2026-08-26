export type XpexExternalLearningProvider = {
  id: string
  name: string
  area: string
  description: string
  access: string
  language: string
  url: string
  highlight: string
}

/**
 * Curated official learning destinations used by the XPeX Trails hub.
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
  },
]
