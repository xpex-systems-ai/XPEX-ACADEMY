import { Award, BookOpen, CalendarDays, ChartNoAxesCombined, GraduationCap, Library, MessageCircle, Route, Settings, Users, Wrench } from 'lucide-react'
import Link from 'next/link'
import { getUriWithOrg } from '@services/config/config'
import { XpexEmptyState, XpexPanel, XpexRoleHero, XpexSectionHeader } from '../XpexPrimitives'

export const xpexPoloSections = ['turmas', 'cursos', 'trilhas', 'mentorias', 'eventos', 'conteudos', 'relatorios', 'certificados', 'recursos', 'configuracoes'] as const
export type XpexPoloSectionId = typeof xpexPoloSections[number]

const sectionCopy: Record<XpexPoloSectionId, { title: string; description: string; empty: string; cta?: string; native?: string; icon: typeof Users }> = {
  turmas: { title: 'Turmas', description: 'Organize grupos e acompanhe as comunidades de aprendizagem do polo.', empty: 'Nenhuma turma criada ainda.', cta: 'Gerenciar turmas no Learning Core', native: '/dash/users/settings/usergroups', icon: GraduationCap },
  cursos: { title: 'Cursos', description: 'Gerencie o catálogo acadêmico real da organização.', empty: 'Nenhum curso publicado ainda.', cta: 'Abrir cursos', native: '/dash/courses', icon: BookOpen },
  trilhas: { title: 'Trilhas', description: 'Combine cursos em jornadas orientadas para objetivos de aprendizagem.', empty: 'Nenhuma trilha disponível para esta organização.', icon: Route },
  mentorias: { title: 'Mentorias', description: 'Centralize o acompanhamento humano e pedagógico.', empty: 'Nenhuma mentoria agendada.', icon: MessageCircle },
  eventos: { title: 'Eventos', description: 'Acompanhe encontros e atividades ao vivo do polo.', empty: 'Nenhum evento agendado.', icon: CalendarDays },
  conteudos: { title: 'Conteúdos', description: 'Acesse a biblioteca nativa sem duplicar o motor acadêmico.', empty: 'Nenhum conteúdo disponível.', cta: 'Abrir biblioteca', native: '/dash/library', icon: Library },
  relatorios: { title: 'Relatórios', description: 'Consulte indicadores disponíveis no Learning Core.', empty: 'Os dados analíticos ainda não estão disponíveis. O restante do painel continua operacional.', cta: 'Abrir Analytics', native: '/dash/analytics', icon: ChartNoAxesCombined },
  certificados: { title: 'Certificados', description: 'Acompanhe certificados emitidos pelo mecanismo acadêmico.', empty: 'Nenhum certificado emitido ainda.', icon: Award },
  recursos: { title: 'Recursos', description: 'Materiais e ferramentas autorizados para a equipe do polo.', empty: 'Nenhum recurso compartilhado ainda.', icon: Wrench },
  configuracoes: { title: 'Configurações', description: 'Atualize as preferências da organização no ambiente nativo.', empty: 'As configurações são mantidas pelo Learning Core.', cta: 'Abrir configurações', native: '/dash/org/settings/general', icon: Settings },
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
      <div className="mt-5"><XpexEmptyState title={content.empty} description="Este estado reflete apenas dados persistidos e autorizados para a organização atual."/></div>
      {href && <Link className="xpex-primary" href={href}>{content.cta}</Link>}
    </XpexPanel>
  </div>
}
