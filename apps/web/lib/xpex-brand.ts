import { BadgeCheck, Bot, Briefcase, Globe2, GraduationCap, Handshake, Newspaper, Rocket, Route, Users, Video, Wrench } from 'lucide-react'

export const XPEX_BRAND = {
  name: 'XpeX Academy',
  positioning: 'Plataforma Global de Desenvolvimento Profissional com Inteligência Artificial',
  slogan: 'Aprenda. Pratique. Construa. Evolua.',
  colors: {
    primaryDark: '#020617',
    navy: '#071B33',
    blue: '#0B3A66',
    gold: '#FACC15',
    cyan: '#38BDF8',
    green: '#22C55E',
    white: '#F8FAFC',
    muted: '#94A3B8',
  },
} as const

export const xpexStrategicModules = [
  { icon: Globe2, title: 'Global Skills Hub', description: 'Catálogo organizado de habilidades, plataformas, trilhas e recursos para desenvolvimento profissional contínuo.' },
  { icon: Route, title: 'Trilhas XpeX', description: 'Jornadas guiadas por objetivo: IA, tecnologia, carreira, marketing, automação, design, dados e negócios.' },
  { icon: GraduationCap, title: 'Cursos Oficiais', description: 'Curadoria de conteúdos e cursos externos de fontes confiáveis, organizados para facilitar a evolução do aluno.' },
  { icon: Rocket, title: 'Cursos Próprios', description: 'Cursos XpeX Originals com foco em prática, projetos reais, IA aplicada e mercado de trabalho.' },
  { icon: Wrench, title: 'Hub de Ferramentas', description: 'Biblioteca de ferramentas gratuitas e pagas para estudar, produzir, automatizar e empreender.' },
  { icon: Bot, title: 'Professor IA', description: 'Camada inteligente planejada para orientar estudos, sugerir trilhas, revisar projetos e apoiar a evolução profissional.' },
  { icon: BadgeCheck, title: 'Certificados', description: 'Registro de conquistas, cursos concluídos, evidências de aprendizagem e evolução por competência.' },
  { icon: Briefcase, title: 'Portfólio', description: 'Espaço para reunir projetos, sites, automações, estudos de caso, apresentações e provas práticas.' },
  { icon: Video, title: 'XpeX TV', description: 'Área de vídeos, tutoriais, demonstrações, lives, aulas rápidas e conteúdos educacionais.' },
  { icon: Newspaper, title: 'Blog', description: 'Conteúdos editoriais sobre IA, tecnologia, carreira, ferramentas, mercado e produtividade.' },
  { icon: Users, title: 'Comunidade', description: 'Ambiente para networking, desafios, grupos, fóruns, colaboração e crescimento coletivo.' },
  { icon: Handshake, title: 'Jobs & Freelance Hub', description: 'Módulo planejado para aproximar alunos de vagas, freelas, portfólios, propostas e oportunidades profissionais.' },
] as const

export const xpexHowItWorks = [
  { step: '01', title: 'Escolha sua trilha', description: 'O aluno começa por um objetivo claro: carreira, IA, tecnologia, design, marketing, dados ou empreendedorismo.' },
  { step: '02', title: 'Aprenda com curadoria', description: 'A plataforma organiza cursos, conteúdos e ferramentas para reduzir confusão e acelerar a evolução.' },
  { step: '03', title: 'Pratique com projetos', description: 'Cada trilha deve levar o aluno a construir algo real, útil e apresentável.' },
  { step: '04', title: 'Monte seu portfólio', description: 'Projetos, certificados e evidências viram uma vitrine profissional.' },
  { step: '05', title: 'Evolua para oportunidades', description: 'O próximo passo é conectar conhecimento a trabalho, freelas, estágios, negócios e carreira.' },
] as const

export const xpexFaq = [
  { question: 'A XpeX Academy é um LMS?', answer: 'Ela usa uma base de LMS, mas nasce como um ecossistema de desenvolvimento profissional com trilhas, ferramentas, IA, portfólio, comunidade e oportunidades.' },
  { question: 'Os cursos de empresas externas são oficiais da XpeX?', answer: 'Não. A XpeX Academy organiza e recomenda conteúdos de fontes externas quando permitido, respeitando marcas, links e condições de uso de cada plataforma.' },
  { question: 'O Professor IA já estará ativo?', answer: 'Nesta fase, o Professor IA será apresentado como módulo estratégico planejado. A integração real será feita em fase posterior.' },
  { question: 'A plataforma vai gerar certificados?', answer: 'O módulo de certificados faz parte do roadmap e será integrado conforme a evolução técnica da plataforma.' },
] as const
