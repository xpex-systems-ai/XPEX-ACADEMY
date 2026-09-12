import { Award, BookOpen, CalendarDays, ChartNoAxesCombined, GraduationCap, Library, MessageCircle, Route, Settings, Users, Wrench } from 'lucide-react'
import { XpexEmptyState, XpexPanel, XpexRoleHero, XpexSectionHeader } from '../XpexPrimitives'
import { XpexCourseStudio } from './XpexCourseStudio'

export const xpexPoloSections = ['turmas', 'cursos', 'trilhas', 'mentorias', 'eventos', 'conteudos', 'relatorios', 'certificados', 'recursos', 'configuracoes'] as const
export type XpexPoloSectionId = typeof xpexPoloSections[number]

type SectionCopy = {
  title: string
  description: string
  stateTitle: string
  stateDescription: string
  icon: typeof Users
}

const sectionCopy: Record<XpexPoloSectionId, SectionCopy> = {
  turmas: {
    title: 'Turmas',
    description: 'Organize grupos e acompanhe as comunidades de aprendizagem do polo.',
    stateTitle: 'Gestão de turmas pela XPeX',
    stateDescription: 'A gestão de turmas será publicada aqui sem abrir o painel técnico do motor acadêmico.',
    icon: GraduationCap,
  },
  cursos: {
    title: 'Cursos',
    description: 'Crie, revise, aprove e publique o catálogo acadêmico da organização.',
    stateTitle: 'Fábrica de Cursos IA',
    stateDescription: 'Criação e publicação de cursos dentro da camada XPeX.',
    icon: BookOpen,
  },
  trilhas: {
    title: 'Trilhas',
    description: 'Combine cursos em jornadas orientadas para objetivos de aprendizagem.',
    stateTitle: 'Trilhas da organização',
    stateDescription: 'Esta área será publicada dentro da experiência XPeX quando a jornada estiver pronta para uso.',
    icon: Route,
  },
  mentorias: {
    title: 'Mentorias',
    description: 'Centralize o acompanhamento humano e pedagógico.',
    stateTitle: 'Mentorias da organização',
    stateDescription: 'Esta área será publicada dentro da experiência XPeX quando o fluxo estiver pronto para uso.',
    icon: MessageCircle,
  },
  eventos: {
    title: 'Eventos',
    description: 'Acompanhe encontros e atividades ao vivo do polo.',
    stateTitle: 'Agenda do polo',
    stateDescription: 'Esta área será publicada dentro da experiência XPeX quando a agenda estiver pronta para uso.',
    icon: CalendarDays,
  },
  conteudos: {
    title: 'Conteúdos',
    description: 'Organize a biblioteca da organização sem expor a interface técnica do motor acadêmico.',
    stateTitle: 'Biblioteca da organização',
    stateDescription: 'A biblioteca será disponibilizada aqui pela camada XPeX, mantendo o motor acadêmico em segundo plano.',
    icon: Library,
  },
  relatorios: {
    title: 'Relatórios',
    description: 'Consulte indicadores persistidos da operação acadêmica.',
    stateTitle: 'Indicadores operacionais',
    stateDescription: 'Os relatórios serão disponibilizados aqui somente com dados reais e sem abrir painéis externos.',
    icon: ChartNoAxesCombined,
  },
  certificados: {
    title: 'Certificados',
    description: 'Acompanhe certificados emitidos pelo mecanismo acadêmico.',
    stateTitle: 'Certificados da organização',
    stateDescription: 'Esta área será publicada dentro da experiência XPeX quando a gestão estiver pronta para uso.',
    icon: Award,
  },
  recursos: {
    title: 'Recursos',
    description: 'Materiais e ferramentas autorizados para a equipe do polo.',
    stateTitle: 'Recursos do polo',
    stateDescription: 'Esta área será publicada dentro da experiência XPeX quando os recursos estiverem prontos para uso.',
    icon: Wrench,
  },
  configuracoes: {
    title: 'Configurações',
    description: 'Preferências autorizadas da organização dentro da experiência XPeX.',
    stateTitle: 'Configurações da organização',
    stateDescription: 'As configurações serão disponibilizadas aqui sem encaminhar a professora para o painel técnico do motor acadêmico.',
    icon: Settings,
  },
}

export function XpexPoloSection({ section, organizationName, organizationSlug }: { section: XpexPoloSectionId; organizationName?: string; organizationSlug: string }) {
  const content = sectionCopy[section]
  const Icon = content.icon

  if (section === 'cursos') {
    return <div className="xpex-dashboard">
      <XpexCourseStudio orgslug={organizationSlug} organizationName={organizationName}/>
    </div>
  }

  return <div className="xpex-dashboard">
    <XpexRoleHero eyebrow={`Polo · ${organizationName ?? 'Organização atual'}`} title={content.title} description={content.description}/>
    <XpexPanel className="xpex-polo-section-panel">
      <div className="xpex-section-icon" aria-hidden="true"><Icon size={26}/></div>
      <XpexSectionHeader eyebrow="Ambiente XPeX" title={content.title}/>
      <div className="mt-5"><XpexEmptyState title={content.stateTitle} description={content.stateDescription}/></div>
    </XpexPanel>
  </div>
}
