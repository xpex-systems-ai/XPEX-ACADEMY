import { BookOpen, CalendarDays, FilePlus2, GraduationCap, MessageCircle, Route, Users } from 'lucide-react'
import Link from 'next/link'
import type { XpexLearningDashboardData } from '@/lib/xpex/learning-dashboard'
import type { XpexRole } from '../xpex-types'
import { XpexActivityList, XpexComingSoon, XpexCourseCard, XpexEmptyState, XpexErrorState, XpexKpiGrid, XpexMetricCard, XpexPanel, XpexQuickAction, XpexRoleHero, XpexSectionHeader } from '../XpexPrimitives'

// Dados reais, quando disponíveis; estados vazios quando a fonte não os oferece.
const copy = {
  aluno: { eyebrow: 'Área do aluno', description: 'Acompanhe cursos e atividades vinculados à sua matrícula, sem estimativas ou dados simulados.' },
  professora: { eyebrow: 'Área da professora', description: 'Organize o trabalho pedagógico somente nas turmas autorizadas para a sua conta.' },
  polo: { eyebrow: 'Visão institucional', description: 'Acompanhe a operação da organização com informações autorizadas e dados disponíveis.' },
} as const

export function AuthenticatedDashboard({ role, displayName, organizationName, organizationSlug, learningData, learningDataFailed = false }: { role: XpexRole; displayName: string; organizationName?: string; organizationSlug: string; learningData?: XpexLearningDashboardData | null; learningDataFailed?: boolean }) {
  const title = role === 'polo' && organizationName ? organizationName : `Olá, ${displayName}.`
  return <div className="xpex-dashboard">
    <XpexRoleHero eyebrow={copy[role].eyebrow} title={title} description={copy[role].description}/>
    {role === 'aluno' ? <StudentDashboard data={learningData} failed={learningDataFailed} organizationSlug={organizationSlug}/> : role === 'professora' ? <TeacherDashboard organizationName={organizationName}/> : <PoleDashboard organizationName={organizationName}/>}
  </div>
}

function StudentDashboard({ data, failed, organizationSlug }: { data?: XpexLearningDashboardData | null; failed: boolean; organizationSlug: string }) {
  if (failed) return <XpexErrorState title="Não foi possível carregar sua jornada" description="Tente novamente em instantes. Seus dados de aprendizagem permanecem seguros."/>
  return <>
    {data?.courses.length ? <><XpexKpiGrid><XpexMetricCard icon={BookOpen} label="Cursos em andamento" value={String(data.summary.active_courses)} detail="Matrículas ativas"/><XpexMetricCard icon={GraduationCap} label="Aulas concluídas" value={`${data.summary.completed_lessons}/${data.summary.total_lessons}`} detail="Dados da sua jornada"/>{data.summary.overall_progress_percent !== null && <XpexMetricCard icon={Route} label="Progresso geral" value={`${data.summary.overall_progress_percent}%`} detail="Calculado com aulas publicadas" tone="orange"/>}</XpexKpiGrid><section id="cursos"><XpexSectionHeader eyebrow="Jornada" title="Continuar aprendendo"/><div className="xpex-course-grid">{data.courses.map(course => <XpexCourseCard key={course.course_id} title={course.title} href={course.target_href} progress={course.progress_percent}/>)}</div></section></> : <section id="cursos"><XpexEmptyState title="Nenhum curso disponível ainda" description="Quando uma matrícula válida for publicada, seu curso e a ação de continuar aparecerão aqui."/></section>}
    <EntryPoints role="aluno" organizationSlug={organizationSlug}/><XpexPanel id="atividades"><XpexSectionHeader eyebrow="Atualizações" title="Atividades recentes"/><div className="mt-5"><XpexActivityList items={[]}/></div></XpexPanel>
  </>
}
function TeacherDashboard({ organizationName }: { organizationName?: string }) { return <>
  {organizationName && <p className="xpex-context">Organização atual: <strong>{organizationName}</strong></p>}
  <XpexEmptyState title="Nenhuma turma disponível" description="Turmas, alunos e indicadores aparecerão somente quando estiverem atribuídos e autorizados para esta conta."/>
  <section><XpexSectionHeader eyebrow="Ferramentas" title="Áreas da professora"/><div className="xpex-actions"><XpexQuickAction icon={GraduationCap} title="Minhas turmas"/><XpexQuickAction icon={Users} title="Alunos"/><XpexQuickAction icon={CalendarDays} title="Mentorias"/><XpexQuickAction icon={MessageCircle} title="Mensagens"/></div></section>
  <XpexPanel id="atividades"><XpexSectionHeader eyebrow="Atualizações" title="Atividades recentes"/><div className="mt-5"><XpexActivityList items={[]}/></div></XpexPanel><EntryPoints role="professora"/>
</> }
function PoleDashboard({ organizationName }: { organizationName?: string }) { return <>
  {!organizationName && <p className="xpex-context">Nome da organização indisponível</p>}
  <XpexEmptyState title="Operação ainda sem dados" description="Indicadores, turmas, eventos e avisos aparecerão quando as integrações operacionais oferecerem dados autorizados."/>
  <section><XpexSectionHeader eyebrow="Operação" title="Ações do polo"/><div className="xpex-actions"><XpexQuickAction icon={GraduationCap} title="Nova turma"/><XpexQuickAction icon={BookOpen} title="Novo curso"/><XpexQuickAction icon={Users} title="Novo aluno"/><XpexQuickAction icon={FilePlus2} title="Relatório"/></div></section>
  <XpexPanel id="atividades"><XpexSectionHeader eyebrow="Atualizações" title="Atividades recentes"/><div className="mt-5"><XpexActivityList items={[]}/></div></XpexPanel><EntryPoints role="polo"/>
</> }
function EntryPoints({ role, organizationSlug }: { role: XpexRole; organizationSlug?: string }) { return <section aria-label={`Próximas experiências para ${role}`}><XpexSectionHeader eyebrow="Acesso rápido" title="Explore o ecossistema"/><div className="xpex-entry-grid">{role === 'aluno' && organizationSlug ? <Link href={`/orgs/${organizationSlug}/courses`} className="xpex-card block p-5"><span className="xpex-label">Catálogo disponível</span><h3 className="mt-2 text-lg font-black text-white">Cursos</h3><p className="mt-2 text-sm text-slate-400">Encontre cursos publicados e autorizados para sua organização.</p><span className="xpex-primary mt-4">Ver cursos</span></Link> : <XpexComingSoon title="Cursos" description="O catálogo estará disponível quando sua organização oferecer cursos."/>}<XpexComingSoon title="Trilhas" description="As trilhas aparecerão quando forem disponibilizadas para sua conta."/><XpexComingSoon title="Laboratório de IA" description="Este módulo ainda não está disponível para estudantes."/></div></section> }
