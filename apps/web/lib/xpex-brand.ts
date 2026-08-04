import { Bot, Briefcase, GraduationCap, Handshake, Layers3, Lightbulb, MapPinned, Route, Users, Wrench } from 'lucide-react'

export const XPEX_BRAND = {
  name: 'XpeX Academy',
  positioning: 'Ecossistema de aprendizagem, criação e desenvolvimento com inteligência artificial',
  slogan: 'Aprenda. Pratique. Construa. Evolua.',
  colors: {
    background0: '#02050B',
    background1: '#050D18',
    surface1: '#081321',
    surface2: '#0E1E30',
    orangePrimary: '#FF6A00',
    orangeSecondary: '#FF8A2A',
    bluePrimary: '#087CFF',
    cyanPrimary: '#16D9FF',
    textPrimary: '#F8FAFC',
    textSecondary: '#A8B4C4',
    borderSoft: 'rgba(148,163,184,0.14)',
  },
} as const

export const xpexBetaExperiences = [
  { role: 'Aluno', href: '/beta/aluno', label: 'Explorar área do aluno', summary: 'Cursos, trilhas, projetos e comunidade em uma jornada demonstrativa para aprender e construir evidências.', focus: ['cursos', 'trilhas', 'projetos', 'comunidade'] },
  { role: 'Professora', href: '/beta/professora', label: 'Conhecer área da professora', summary: 'Acompanhamento pedagógico, turma piloto, feedback e mentorias com dados fictícios para visualização.', focus: ['acompanhamento pedagógico', 'turma', 'feedback', 'mentorias'] },
  { role: 'Polo', href: '/beta/polo', label: 'Conhecer experiência do polo', summary: 'Presença local, operação piloto, eventos e aprendizagem comunitária sem dados reais de matrícula.', focus: ['presença local', 'operação piloto', 'eventos', 'aprendizagem comunitária'] },
] as const

export const xpexPilotCourse = {
  code: 'XPEX-PILOT-01',
  title: 'Primeiros Passos com IA',
  module: 'Módulo 0 — Primeiro Contato com a Inteligência Artificial',
  description: 'Primeira jornada demonstrativa de aprendizagem para acolher, explicar usos cotidianos de IA e orientar uma atividade prática com evidência inicial de portfólio.',
  includes: ['Introdução acolhedora', 'Entendimento da IA no cotidiano', 'Atividade prática guiada', 'Primeira evidência de portfólio'],
} as const

export const xpexStrategicModules = [
  { icon: Route, title: 'Cursos e trilhas', status: 'Beta demonstrativo', description: 'Organização de jornadas educacionais guiadas, com foco em prática e progressão clara.' },
  { icon: Briefcase, title: 'Projetos e portfólio', status: 'Beta demonstrativo', description: 'Evidências de aprendizagem apresentadas como construção prática, sem prometer contratação ou renda.' },
  { icon: Bot, title: 'Professor IA', status: 'Roadmap', description: 'Camada planejada para apoiar estudos e revisão de projetos, sempre como suporte à professora.' },
  { icon: Wrench, title: 'Laboratório de IA', status: 'Roadmap', description: 'Espaço futuro para ferramentas, experimentos e automações educacionais com orientação.' },
  { icon: Users, title: 'Comunidade', status: 'Beta demonstrativo', description: 'Ambiente de colaboração e desafios apresentado em telas beta com informações fictícias.' },
  { icon: Handshake, title: 'Oportunidades futuras', status: 'Roadmap', description: 'Visão futura para aproximar portfólio e oportunidades, sem integração ativa com terceiros.' },
] as const

export const xpexHowItWorks = [
  { step: 'Aprenda', description: 'Comece por conceitos claros, curadoria e objetivos de aprendizagem alcançáveis.' },
  { step: 'Pratique', description: 'Transforme conteúdo em exercícios guiados, experimentos e pequenas entregas.' },
  { step: 'Construa', description: 'Organize projetos que demonstrem evolução real e possam compor um portfólio.' },
  { step: 'Compartilhe', description: 'Receba acompanhamento humano, troque aprendizados e melhore com feedback.' },
  { step: 'Evolua', description: 'Reflita sobre progresso, próximos passos e novas trilhas sem promessas de resultado externo.' },
] as const

export const xpexTransparencyNotes = [
  'A landing apresenta uma experiência beta em evolução.',
  'As telas beta usam dados fictícios e demonstrativos.',
  'Não há alegação de integrações ativas com terceiros nesta etapa.',
  'Não são exibidos dados reais de matrícula, operação financeira ou certificação externa.',
  'Módulos de roadmap aparecem identificados como futuros ou planejados.',
  'A base técnica open-source LearnHouse e a referência AGPL-3.0 permanecem atribuídas.',
] as const

export const xpexHumanLayer = [
  { icon: GraduationCap, title: 'Autonomia do aluno', description: 'A jornada incentiva escolha, prática e reflexão sobre evidências de aprendizagem.' },
  { icon: Lightbulb, title: 'Liderança pedagógica', description: 'A professora permanece como referência humana para acompanhamento, feedback e mentoria.' },
  { icon: MapPinned, title: 'Apoio local do polo', description: 'O polo contextualiza encontros, eventos e aprendizagem comunitária em operação piloto.' },
  { icon: Layers3, title: 'IA como suporte', description: 'Recursos inteligentes são descritos como apoio planejado, não substituição da professora.' },
] as const
