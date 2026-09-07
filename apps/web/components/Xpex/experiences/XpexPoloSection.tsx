import { Award, BookOpen, CalendarDays, ChartNoAxesCombined, GraduationCap, Library, MessageCircle, Route, Settings, Users, Wrench } from 'lucide-react'
import Link from 'next/link'
import { getUriWithOrg } from '@services/config/config'
import { XpexEmptyState, XpexPanel, XpexRoleHero, XpexSectionHeader } from '../XpexPrimitives'

export const xpexPoloSections = ['turmas', 'cursos', 'trilhas', 'mentorias', 'eventos', 'conteudos', 'relatorios', 'certificados', 'recursos', 'configuracoes'] as const
export type XpexPoloSectionId = typeof xpexPoloSections[number]

type SectionCopy = {
  title: string
  description: string
  stateTitle: string
  stateDescription: string
  cta?: string
  native?: string
  icon: typeof Users
}

const sectionCopy: Record<XpexPoloSectionId, SectionCopy> = {
  turmas: {
    title: 'Turmas',
    description: 'Organize grupos e acompanhe as comunidades de aprendizagem do polo.',
    stateTitle: 'Gestão de turmas no Learning Core',
    stateDescription: 'Consulte a área nativa para ver os grupos e turmas persistidos desta organização.',
    cta: 'Gerenciar turmas no Learning Core',
    native: '/dash/users/settings/usergroups',
    icon: GraduationCap,
  },
  cursos: {
    title: 'Cursos',
    description: 'Gerencie o catálogo acadêmico real da organização.',
    stateTitle: 'Catálogo acadêmico da organização',
    stateDescription: 'Abra a área nativa para consultar os cursos publicados e rascunhos reais desta organização.',
    cta: 'Abrir cursos',
    native: '/dash/courses',
    icon: BookOpen,
  },
  trilhas: {
    title: 'Trilhas',
    description: 'Combine cursos em jornadas orientadas para objetivos de aprendizagem.',
    stateTitle: 'Trilhas da organização',
    stateDescription: 'Esta área exibirá somente trilhas persistidas e autorizadas quando a integração estiver disponível.',
    icon: Route,
  },
  mentorias: {
    title: 'Mentorias',
    description: 'Centralize o acompanhamento humano e pedagógico.',
    stateTitle: 'Mentorias da organização',
    stateDescription: 'Esta área exibirá somente mentorias persistidas e autorizadas quando a integração estiver disponível.',
    icon: MessageCircle,
  },
  eventos: {
    title: 'Eventos',
    description: 'Acompanhe encontros e atividades ao vivo do polo.',
    stateTitle: 'Agenda do polo',
    stateDescription: 'Esta área exibirá somente eventos persistidos e autorizados quando a integração estiver disponível.',
    icon: CalendarDays,
  },
  conteudos: {
    title: 'Conteúdos',
    description: 'Acesse a biblioteca nativa sem duplicar o motor acadêmico.',
    stateTitle: 'Biblioteca da organização',
    stateDescription: 'Abra a biblioteca nativa para consultar os conteúdos reais disponíveis para esta organização.',
    cta: 'Abrir biblioteca',
    native: '/dash/library',
    icon: Library,
  },
  relatorios: {
    title: 'Relatórios',
    description: 'Consulte indicadores disponíveis no Learning Core.',
    stateTitle: 'Indicadores operacionais',
    stateDescription: 'Abra o Analytics para consultar os dados disponíveis. Se a telemetria estiver indisponível, o restante do painel continua operacional.',
    cta: 'Abrir Analytics',
    native: '/dash/analytics',
    icon: ChartNoAxesCombined,
  },
  certificados: {
    title: 'Certificados',
    description: 'Acompanhe certificados emitidos pelo mecanismo acadêmico.',
    stateTitle: 'Certificados da organização',
    stateDescription: 'Esta área exibirá somente certificados persistidos pelo mecanismo acadêmico quando a integração estiver disponível.',
    icon: Award,
  },
  recursos: {
    title: 'Recursos',
    description: 'Materiais e ferramentas autorizados para a equipe do polo.',
    stateTitle: 'Recursos do polo',
    stateDescription: 'Esta área exibirá somente recursos persistidos e autorizados quando a integração estiver disponível.',
    icon: Wrench,
  },
  configuracoes: {
    title: 'Configurações',
    description: 'Atualize as preferências da organização no ambiente nativo.',
    stateTitle: 'Configurações da organização',
    stateDescription: 'As configurações são mantidas pelo Learning Core e podem ser abertas com segurança no ambiente nativo.',
    cta: 'Abrir configurações',
    native: '/dash/org/settings/general',
    icon: Settings,
  },
}

export function XpexPoloSection({ section, organizationName, organizationSlug }: { section: XpexPoloSectionId; organizationName?: string; organizationSlug: string }) {
  const content = sectionCopy[section]
  const Icon = content.icon
  const href = content.native ? getUriWithOrg(organizationSlug, content.native) : undefined

  return <div className="xpex-dashboard">
    <XpexRoleHero eyebrow={`Polo XPeX Academy · ${organizationName ?? 'Organização atual'}`} title={content.title} description={content.description}/>
    <XpexPanel className="xpex-polo-section-panel">
      <div className="xpex-section-icon" aria-hidden="true"><Icon size={26}/></div>
      <XpexSectionHeader eyebrow="Dados da organização" title={content.title}/>
      <div className="mt-5"><XpexEmptyState title={content.stateTitle} description={content.stateDescription}/></div>
      {href && <Link className="xpex-primary" href={href}>{content.cta}</Link>}
    </XpexPanel>
  </div>
}
