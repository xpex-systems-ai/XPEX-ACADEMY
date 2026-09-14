import { ArrowUpRight, Award, BookOpen, CalendarDays, ChartNoAxesCombined, CheckCircle2, GraduationCap, Library, MessageCircle, Route, Settings, Users, Wrench } from 'lucide-react'
import Link from 'next/link'
import { getUriWithOrg } from '@services/config/config'
import { XpexPanel, XpexSectionHeader } from '../XpexPrimitives'
import type { PoloBranding } from '@/lib/xpex/polo-branding'
import { PoloIdentityHero } from './PoloIdentityHero'

export const xpexPoloSections = ['turmas', 'cursos', 'trilhas', 'mentorias', 'eventos', 'conteudos', 'relatorios', 'certificados', 'recursos', 'configuracoes'] as const
export type XpexPoloSectionId = typeof xpexPoloSections[number]

type SectionCopy = {
  title: string
  description: string
  stateTitle: string
  stateDescription: string
  highlights: readonly [string, string, string]
  cta?: string
  native?: string
  icon: typeof Users
}

const sectionCopy: Record<XpexPoloSectionId, SectionCopy> = {
  turmas: {
    title: 'Turmas',
    description: 'Organize grupos e acompanhe as comunidades de aprendizagem do polo.',
    stateTitle: 'Gestão acadêmica centralizada',
    stateDescription: 'Consulte grupos reais da organização, participantes vinculados e permissões em um único ambiente.',
    highlights: ['Grupos da organização', 'Participantes autorizados', 'Acesso por função'],
    cta: 'Gerenciar turmas',
    native: '/dash/users/settings/usergroups',
    icon: GraduationCap,
  },
  cursos: {
    title: 'Cursos',
    description: 'Gerencie o catálogo acadêmico da organização.',
    stateTitle: 'Catálogo oficial do Polo',
    stateDescription: 'Acesse publicações, rascunhos e a estrutura pedagógica conectada à organização.',
    highlights: ['Cursos publicados', 'Rascunhos protegidos', 'Conteúdo por organização'],
    cta: 'Abrir catálogo',
    native: '/dash/courses',
    icon: BookOpen,
  },
  trilhas: {
    title: 'Trilhas',
    description: 'Estruture jornadas orientadas para objetivos de aprendizagem.',
    stateTitle: 'Jornadas de aprendizagem',
    stateDescription: 'A estrutura do Polo está preparada para organizar cursos em sequências pedagógicas progressivas.',
    highlights: ['Sequência pedagógica', 'Objetivos claros', 'Evolução acompanhada'],
    icon: Route,
  },
  mentorias: {
    title: 'Mentorias',
    description: 'Centralize o acompanhamento humano e pedagógico.',
    stateTitle: 'Acompanhamento próximo',
    stateDescription: 'Um espaço preparado para conectar orientação, encontros e evolução dos participantes.',
    highlights: ['Orientação individual', 'Registro de encontros', 'Acompanhamento contínuo'],
    icon: MessageCircle,
  },
  eventos: {
    title: 'Eventos',
    description: 'Organize encontros e atividades ao vivo do polo.',
    stateTitle: 'Agenda do Polo',
    stateDescription: 'A experiência está preparada para receber encontros, oficinas e atividades da comunidade.',
    highlights: ['Encontros ao vivo', 'Oficinas práticas', 'Agenda organizada'],
    icon: CalendarDays,
  },
  conteudos: {
    title: 'Conteúdos',
    description: 'Acesse a biblioteca acadêmica da organização em um ambiente integrado.',
    stateTitle: 'Biblioteca da organização',
    stateDescription: 'Consulte materiais reais disponíveis para esta organização com escopo e acesso controlados.',
    highlights: ['Arquivos organizados', 'Pastas por contexto', 'Acesso autorizado'],
    cta: 'Abrir biblioteca',
    native: '/dash/library',
    icon: Library,
  },
  relatorios: {
    title: 'Relatórios',
    description: 'Consulte indicadores acadêmicos e operacionais da organização.',
    stateTitle: 'Inteligência operacional',
    stateDescription: 'Acompanhe somente indicadores disponíveis e persistidos pela infraestrutura acadêmica.',
    highlights: ['Dados persistidos', 'Escopo da organização', 'Leitura operacional'],
    cta: 'Abrir análises',
    native: '/dash/analytics',
    icon: ChartNoAxesCombined,
  },
  certificados: {
    title: 'Certificados',
    description: 'Acompanhe certificados emitidos pela plataforma acadêmica.',
    stateTitle: 'Conquistas verificáveis',
    stateDescription: 'A estrutura está preparada para apresentar certificados vinculados a conclusões registradas.',
    highlights: ['Conclusão registrada', 'Validação acadêmica', 'Histórico do aluno'],
    icon: Award,
  },
  recursos: {
    title: 'Recursos',
    description: 'Materiais e ferramentas autorizados para a equipe do polo.',
    stateTitle: 'Central de recursos',
    stateDescription: 'Organize ferramentas, materiais de apoio e acessos úteis para a operação do Polo.',
    highlights: ['Materiais de apoio', 'Ferramentas do Polo', 'Acesso da equipe'],
    icon: Wrench,
  },
  configuracoes: {
    title: 'Configurações',
    description: 'Atualize as preferências da organização no ambiente administrativo.',
    stateTitle: 'Identidade e preferências',
    stateDescription: 'Gerencie as configurações autorizadas da organização em uma área administrativa protegida.',
    highlights: ['Identidade visual', 'Preferências do Polo', 'Permissões protegidas'],
    cta: 'Abrir configurações',
    native: '/dash/org/settings/general',
    icon: Settings,
  },
}

export function XpexPoloSection({ section, branding, organizationSlug }: { section: XpexPoloSectionId; branding: PoloBranding; organizationSlug: string }) {
  const content = sectionCopy[section]
  const Icon = content.icon
  const href = content.native ? getUriWithOrg(organizationSlug, content.native) : undefined

  return <div className="xpex-dashboard">
    <PoloIdentityHero branding={branding}/>
    <XpexSectionHeader eyebrow={`${branding.organization_name} · ${content.title}`} title={content.title} detail={<p className="xpex-context">{content.description}</p>}/>
    <XpexPanel className="xpex-polo-section-panel xpex-polo-section-premium">
      <div className="xpex-polo-section-lead">
        <div className="xpex-section-icon" aria-hidden="true"><Icon size={26}/></div>
        <div>
          <p className="xpex-label">Ambiente oficial do Polo</p>
          <h2>{content.stateTitle}</h2>
          <p>{content.stateDescription}</p>
        </div>
        <span className="xpex-polo-connected"><CheckCircle2 size={15} aria-hidden="true"/> Ambiente conectado</span>
      </div>
      <div className="xpex-polo-capabilities" aria-label={`Recursos de ${content.title}`}>
        {content.highlights.map((highlight) => <div key={highlight}><span aria-hidden="true"/><strong>{highlight}</strong></div>)}
      </div>
      <div className="xpex-polo-section-footer">
        <p>Dados e ações respeitam a organização atual e as permissões da conta.</p>
        {href ? <Link className="xpex-primary" href={href}>{content.cta}<ArrowUpRight size={16} aria-hidden="true"/></Link> : <span className="xpex-polo-ready">Estrutura preparada para ativação</span>}
      </div>
    </XpexPanel>
  </div>
}
