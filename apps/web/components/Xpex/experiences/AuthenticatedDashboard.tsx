import { BookOpen, CalendarDays, CheckCircle2, FilePlus2, GraduationCap, MessageCircle, Route, Users } from 'lucide-react'
import Link from 'next/link'
import type { XpexLearningCourse, XpexLearningDashboardData } from '@/lib/xpex/learning-dashboard'
import type { XpexTeacherDashboardData } from '@/lib/xpex/teacher-dashboard'
import type { XpexLaunchReadinessData } from '@/lib/xpex/launch-readiness'
import type { XpexPoloAccess } from '@/lib/xpex/access'
import { getCourseThumbnailMediaDirectory } from '@services/media/media'
import type { XpexRole } from '../xpex-types'
import { XpexActivityList, XpexComingSoon, XpexCourseCard, XpexEmptyState, XpexErrorState, XpexKpiGrid, XpexMetricCard, XpexPanel, XpexQuickAction, XpexRoleHero, XpexSectionHeader } from '../XpexPrimitives'

const getCourseImageUrl = (course: XpexLearningCourse) =>
  course.image_url
    ? getCourseThumbnailMediaDirectory(course.org_uuid, course.course_id, course.image_url)
    : null

const isCompletedCourse = (course: XpexLearningCourse) =>
  course.total_lessons > 0 && course.completed_lessons >= course.total_lessons

const getEnrollmentStatusLabel = (course: XpexLearningCourse) => {
  if (course.enrollment_state === 'STATUS_PAUSED') return 'Pausado'
  if (course.enrollment_state === 'STATUS_COMPLETED' || isCompletedCourse(course)) return 'Concluído'
  if (course.completed_lessons > 0) return 'Em andamento'
  return 'Não iniciado'
}

const copy = {
  aluno: { eyebrow: 'Área do aluno', description: 'Acompanhe cursos e atividades vinculados à sua matrícula, sem estimativas ou dados simulados.' },
  professora: { eyebrow: 'Área da professora', description: 'Acompanhe somente cursos em que sua autoria está ativa e os estados agregados das matrículas vinculadas.' },
  polo: { eyebrow: 'Visão institucional', description: 'Acompanhe a operação da organização com informações autorizadas e dados disponíveis.' },
} as const

export function AuthenticatedDashboard({ role, displayName, organizationName, organizationSlug, learningData, learningDataFailed = false, teacherData, teacherDataFailed = false, launchReadiness, launchReadinessFailed = false, poloAccess }: { role: XpexRole; displayName: string; organizationName?: string; organizationSlug: string; learningData?: XpexLearningDashboardData | null; learningDataFailed?: boolean; teacherData?: XpexTeacherDashboardData | null; teacherDataFailed?: boolean; launchReadiness?: XpexLaunchReadinessData | null; launchReadinessFailed?: boolean; poloAccess?: XpexPoloAccess | null }) {
  const title = role === 'polo' && organizationName ? organizationName : `Olá, ${displayName}.`
  return <div className="xpex-dashboard">
    <XpexRoleHero eyebrow={`${copy[role].eyebrow}${organizationName ? ` · ${organizationName}` : ''}`} title={title} description={copy[role].description}/>
    {role === 'aluno' ? <StudentDashboard data={learningData} failed={learningDataFailed} organizationName={organizationName} organizationSlug={organizationSlug}/> : role === 'professora' ? <TeacherDashboard data={teacherData} failed={teacherDataFailed} organizationName={organizationName}/> : <UnifiedPoloDashboard organizationName={organizationName} organizationSlug={organizationSlug} data={launchReadiness} failed={launchReadinessFailed} teacherData={teacherData} teacherFailed={teacherDataFailed} access={poloAccess}/>}
  </div>
}

function UnifiedPoloDashboard({ access, teacherData, teacherFailed, ...poleProps }: { access?: XpexPoloAccess | null; teacherData?: XpexTeacherDashboardData | null; teacherFailed: boolean; organizationName?: string; organizationSlug: string; data?: XpexLaunchReadinessData | null; failed: boolean }) {
  return <>
    {access?.isManager ? <PoleDashboard {...poleProps}/> : null}
    {access?.isTeacher ? <section aria-label="Operação pedagógica integrada"><XpexSectionHeader eyebrow="Ensino no mesmo painel" title="Minha atuação pedagógica"/><TeacherDashboard data={teacherData} failed={teacherFailed} organizationName={poleProps.organizationName}/></section> : null}
  </>
}

function StudentDashboard({ data, failed, organizationName, organizationSlug }: { data?: XpexLearningDashboardData | null; failed: boolean; organizationName?: string; organizationSlug: string }) {
  if (failed) return <XpexErrorState title="Não foi possível carregar sua jornada" description="Tente novamente em instantes. Seus dados de aprendizagem permanecem seguros."/>
  const courses = data?.courses ?? []
  const current = data?.continue_learning
  const activeCourses = data ? data.summary.active_courses : 0
  const currentCompleted = current ? isCompletedCourse(current) || current.enrollment_state === 'STATUS_COMPLETED' : false
  return <>
    {courses.length ? <XpexKpiGrid><XpexMetricCard icon={BookOpen} label="Cursos matriculados" value={String(courses.length)} detail="Acesso válido nesta organização"/><XpexMetricCard icon={GraduationCap} label="Cursos em andamento" value={String(activeCourses)} detail="Matrículas ativas"/><XpexMetricCard icon={CheckCircle2} label="Atividades concluídas" value={String(data!.summary.completed_lessons)} detail={`De ${data!.summary.total_lessons} atividades publicadas`}/>{data!.summary.overall_progress_percent !== null && <XpexMetricCard icon={Route} label="Progresso agregado" value={`${data!.summary.overall_progress_percent}%`} detail="Calculado com atividades publicadas" tone="orange"/>}</XpexKpiGrid> : null}
    <section id="continuar"><XpexSectionHeader eyebrow="Sua jornada" title="Continue de onde parou"/>{current ? <div className="xpex-course-grid"><XpexCourseCard featured title={current.title} href={current.target_href} progress={current.progress_percent} imageUrl={getCourseImageUrl(current)} organization={organizationName ?? data?.organization} status={getEnrollmentStatusLabel(current)}/></div> : <div className="mt-4"><XpexEmptyState compact title="Pronto para começar?" description={courses.length ? 'Abra um dos seus cursos matriculados para iniciar uma atividade.' : 'Quando uma matrícula válida for publicada, sua próxima atividade aparecerá aqui.'}/></div>}</section>
    <section id="cursos"><XpexSectionHeader eyebrow="Aprendizado autorizado" title="Meus cursos"/>{courses.length ? <div className="xpex-course-grid">{courses.map(course => <XpexCourseCard key={course.course_id} title={course.title} href={course.target_href} progress={course.progress_percent} imageUrl={getCourseImageUrl(course)} organization={organizationName ?? data?.organization} status={getEnrollmentStatusLabel(course)}/>)}</div> : <div className="mt-4"><XpexEmptyState title="Nenhum curso disponível ainda" description="Quando uma matrícula válida for publicada, seu curso e a ação de continuar aparecerão aqui."/></div>}</section>
    <section aria-label="Próximas ações"><XpexSectionHeader eyebrow="Agora" title="Próxima ação"/><div className="xpex-entry-grid">{current ? <Link href={current.target_href} className="xpex-card xpex-next-action"><Route aria-hidden="true"/><div><strong>{currentCompleted ? `Revisar ${current.title}` : `Continuar ${current.title}`}</strong><span>{currentCompleted ? 'Curso concluído. Revise o conteúdo quando quiser.' : 'Retome sua próxima atividade disponível.'}</span></div></Link> : courses[0] ? <Link href={courses[0].target_href} className="xpex-card xpex-next-action"><BookOpen aria-hidden="true"/><div><strong>Abrir {courses[0].title}</strong><span>Conheça as atividades liberadas para sua matrícula.</span></div></Link> : <XpexComingSoon title="Aguardando matrícula" description="Nenhuma ação de aprendizagem está disponível para sua conta."/>}</div></section>
    <EntryPoints role="aluno" organizationSlug={organizationSlug}/><XpexPanel id="atividades"><XpexSectionHeader eyebrow="Atualizações" title="Atividades recentes"/><div className="mt-5"><XpexActivityList items={[]}/></div></XpexPanel>
  </>
}

function TeacherDashboard({ data, failed, organizationName }: { data?: XpexTeacherDashboardData | null; failed: boolean; organizationName?: string }) {
  if (failed) return <XpexErrorState title="Não foi possível carregar sua visão pedagógica" description="Tente novamente em instantes. Nenhum dado de aluno foi exposto fora do seu escopo autorizado."/>
  const courses = data?.courses ?? []
  return <>
    {organizationName && <p className="xpex-context">Organização atual: <strong>{organizationName}</strong></p>}
    <XpexKpiGrid>
      <XpexMetricCard icon={BookOpen} label="Cursos publicados" value={String(data?.summary.published_courses ?? 0)} detail="Com autoria ativa nesta conta"/>
      <XpexMetricCard icon={Users} label="Alunos matriculados" value={String(data?.summary.enrolled_students ?? 0)} detail="Contagem única nos seus cursos"/>
      <XpexMetricCard icon={GraduationCap} label="Alunos em andamento" value={String(data?.summary.active_students ?? 0)} detail="Matrículas ativas"/>
      <XpexMetricCard icon={CheckCircle2} label="Alunos concluídos" value={String(data?.summary.completed_students ?? 0)} detail="Conclusões registradas" tone="orange"/>
    </XpexKpiGrid>
    <section id="cursos"><XpexSectionHeader eyebrow="Acompanhamento" title="Meus cursos"/>{courses.length ? <div className="xpex-course-grid">{courses.map(course => <Link key={course.course_id} href={course.target_href} className="xpex-card block p-5"><span className="xpex-label">Curso publicado</span><h3 className="mt-2 text-lg font-black text-white">{course.title}</h3>{course.description && <p className="mt-2 text-sm text-slate-400">{course.description}</p>}<div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300"><span><strong className="text-white">{course.enrolled_students}</strong> matriculados</span><span><strong className="text-white">{course.active_students}</strong> em andamento</span><span><strong className="text-white">{course.completed_students}</strong> concluídos</span><span><strong className="text-white">{course.paused_students}</strong> pausados</span></div><span className="xpex-primary mt-4">Abrir curso</span></Link>)}</div> : <div className="mt-4"><XpexEmptyState title="Nenhum curso atribuído" description="Quando sua conta tiver autoria ativa em um curso publicado, os indicadores pedagógicos aparecerão aqui."/></div>}</section>
    <section><XpexSectionHeader eyebrow="Ferramentas" title="Áreas da professora"/><div className="xpex-actions"><XpexQuickAction icon={GraduationCap} title="Meus cursos"/><XpexQuickAction icon={Users} title="Alunos"/><XpexQuickAction icon={CalendarDays} title="Mentorias"/><XpexQuickAction icon={MessageCircle} title="Mensagens"/></div></section>
    <XpexPanel id="atividades"><XpexSectionHeader eyebrow="Privacidade" title="Visão agregada por padrão"/><p className="mt-3 text-sm text-slate-400">Este painel não lista nomes, e-mails ou dados pessoais de estudantes. Ele resume somente estados de matrícula dos cursos em que sua autoria está ativa.</p></XpexPanel><EntryPoints role="professora"/>
  </>
}

function ReadinessGate({ label, ready }: { label: string; ready: boolean }) {
  return <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3"><span className="text-sm font-semibold text-slate-200">{label}</span><span className={`text-xs font-black uppercase tracking-wider ${ready ? 'text-emerald-300' : 'text-amber-300'}`}>{ready ? 'Pronto' : 'Pendente'}</span></div>
}

function PoleDashboard({ organizationName, organizationSlug, data, failed }: { organizationName?: string; organizationSlug: string; data?: XpexLaunchReadinessData | null; failed: boolean }) {
  if (failed) return <XpexErrorState title="Não foi possível calcular a prontidão de lançamento" description="O painel administrativo continua protegido. Atualize em instantes para recalcular os gates de produção."/>
  const statusTitle = data?.ready_for_official_intake ? 'Pronto para entrada oficial' : data?.ready_for_controlled_pilot ? 'Pronto para piloto controlado' : 'Preparação em andamento'
  return <>
    {!organizationName && <p className="xpex-context">Nome da organização indisponível</p>}
    {data ? <XpexKpiGrid>
      <XpexMetricCard icon={BookOpen} label="Cursos publicados" value={String(data.metrics.published_courses)} detail="Cursos disponíveis na organização"/>
      <XpexMetricCard icon={Route} label="Atividades publicadas" value={String(data.metrics.published_activities)} detail="Aulas e atividades publicadas"/>
      <XpexMetricCard icon={Users} label="Alunos matriculados" value={String(data.metrics.enrolled_students)} detail={`${data.metrics.active_students} em andamento`}/>
      <XpexMetricCard icon={GraduationCap} label="Professoras" value={String(data.metrics.teachers)} detail="Perfis de instrutora vinculados" tone="orange"/>
    </XpexKpiGrid> : <XpexEmptyState title="Prontidão ainda sem dados" description="O backend ainda não retornou o snapshot operacional desta organização."/>}
    {data && <XpexPanel><XpexSectionHeader eyebrow="XPEX-LAUNCH-READINESS" title={statusTitle} detail={<span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${data.ready_for_official_intake ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'}`}>{data.ready_for_official_intake ? 'GO' : 'CHECK'}</span>}/><p className="mt-3 text-sm text-slate-400">Gate calculado somente com dados persistidos: publicação, matrícula, progresso e professora vinculada.</p><div className="mt-5 grid gap-3 md:grid-cols-2"><ReadinessGate label="Acesso administrativo" ready={data.gates.admin_access}/><ReadinessGate label="Curso publicado" ready={data.gates.published_course}/><ReadinessGate label="Atividade publicada" ready={data.gates.published_activity}/><ReadinessGate label="Matrícula piloto" ready={data.gates.pilot_enrollment}/><ReadinessGate label="Progresso verificado" ready={data.gates.progress_verified}/><ReadinessGate label="Professora vinculada" ready={data.gates.teacher_assigned}/></div></XpexPanel>}
    <div className="grid gap-5 lg:grid-cols-2"><XpexPanel><XpexSectionHeader eyebrow="Turmas ativas" title="Acompanhamento de turmas"/><XpexEmptyState compact title="Nenhuma turma disponível" description="Turmas aparecerão aqui somente quando forem persistidas e autorizadas para esta organização."/></XpexPanel><XpexPanel><XpexSectionHeader eyebrow="Atividade e agenda" title="Operação recente"/><XpexEmptyState compact title="Operação ainda sem dados" description="Eventos, avisos e ações auditáveis aparecerão quando houver uma fonte persistida disponível."/></XpexPanel></div>
    <section><XpexSectionHeader eyebrow="Operação" title="Ações do polo"/><div className="xpex-actions"><XpexQuickAction icon={GraduationCap} title="Nova turma"/><XpexQuickAction icon={BookOpen} title="Novo curso" disabled={false} href={`/orgs/${organizationSlug}/course-studio`} detail="Abrir Course Studio"/><XpexQuickAction icon={Users} title="Novo aluno"/><XpexQuickAction icon={FilePlus2} title="Relatório"/></div></section>
    <XpexPanel id="atividades"><XpexSectionHeader eyebrow="Operação real" title="Estado de aprendizagem"/><div className="mt-5 grid gap-3 sm:grid-cols-3"><ReadinessGate label={`${data?.metrics.active_students ?? 0} alunos ativos`} ready={(data?.metrics.active_students ?? 0) > 0}/><ReadinessGate label={`${data?.metrics.completed_activities ?? 0} atividades concluídas`} ready={(data?.metrics.completed_activities ?? 0) > 0}/><ReadinessGate label={`${data?.metrics.completed_students ?? 0} alunos concluídos`} ready={(data?.metrics.completed_students ?? 0) > 0}/></div></XpexPanel><EntryPoints role="polo" organizationSlug={organizationSlug}/>
  </>
}

function EntryPoints({ role, organizationSlug }: { role: XpexRole; organizationSlug?: string }) {
  const courseLink = organizationSlug ? `/orgs/${organizationSlug}/courses` : null
  if (role === 'polo' && organizationSlug) return <section aria-label="Acessos administrativos"><XpexSectionHeader eyebrow="Acesso rápido" title="Explore o ecossistema"/><div className="xpex-entry-grid"><Link href={courseLink!} className="xpex-card block p-5"><span className="xpex-label">Operacional</span><h3 className="mt-2 text-lg font-black text-white">Cursos</h3><p className="mt-2 text-sm text-slate-400">Gerencie o catálogo real da organização.</p><span className="xpex-primary mt-4">Abrir cursos</span></Link><Link href={`/orgs/${organizationSlug}/course-studio`} className="xpex-card block p-5"><span className="xpex-label">IA editorial</span><h3 className="mt-2 text-lg font-black text-white">Fábrica de Cursos IA</h3><p className="mt-2 text-sm text-slate-400">Criar, revisar, aprovar e publicar cursos.</p><span className="xpex-primary mt-4">Abrir fábrica</span></Link><Link href="/xpex/admin" className="xpex-card block p-5"><span className="xpex-label">Governança</span><h3 className="mt-2 text-lg font-black text-white">Painel Admin</h3><p className="mt-2 text-sm text-slate-400">Acesse o centro administrativo nativo da XPeX.</p><span className="xpex-primary mt-4">Abrir painel</span></Link></div></section>
  return <section aria-label={`Próximas experiências para ${role}`}><XpexSectionHeader eyebrow="Acesso rápido" title="Explore o ecossistema"/><div className="xpex-entry-grid">{role === 'aluno' && courseLink ? <Link href={courseLink} className="xpex-card block p-5"><span className="xpex-label">Catálogo disponível</span><h3 className="mt-2 text-lg font-black text-white">Cursos</h3><p className="mt-2 text-sm text-slate-400">Encontre cursos publicados e autorizados para sua organização.</p><span className="xpex-primary mt-4">Ver cursos</span></Link> : <XpexComingSoon title="Cursos" description="O catálogo estará disponível quando sua organização oferecer cursos."/>}<XpexComingSoon title="Trilhas" description="As trilhas aparecerão quando forem disponibilizadas para sua conta."/><XpexComingSoon title="Laboratório de IA" description="Este módulo ainda não está disponível para estudantes."/></div></section>
}
