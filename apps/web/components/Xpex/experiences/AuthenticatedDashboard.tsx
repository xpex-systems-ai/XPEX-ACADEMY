import { BookOpen, CheckCircle2, FilePlus2, GraduationCap, Route, Users } from 'lucide-react'
import Link from 'next/link'
import { xpexLearnerCoursesRoute } from '@/lib/xpexRouteMap'
import type { XpexLearningCourse, XpexLearningDashboardData } from '@/lib/xpex/learning-dashboard'
import type { XpexTeacherDashboardData } from '@/lib/xpex/teacher-dashboard'
import type { XpexLaunchReadinessData } from '@/lib/xpex/launch-readiness'
import type { PoloBranding } from '@/lib/xpex/polo-branding'
import type { XpexPoloAccess } from '@/lib/xpex/access'
import { getCourseThumbnailMediaDirectory } from '@services/media/media'
import type { XpexRole } from '../xpex-types'
import { XpexCourseCard, XpexEmptyState, XpexErrorState, XpexKpiGrid, XpexMetricCard, XpexPanel, XpexQuickAction, XpexRoleHero, XpexSectionHeader } from '../XpexPrimitives'
import { PoloIdentityHero } from './PoloIdentityHero'

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
  aluno: { eyebrow: 'Área do aluno', description: 'Acompanhe seus cursos, atividades e progresso vinculados à matrícula.' },
  professora: { eyebrow: 'Área da professora', description: 'Acompanhe somente cursos em que sua autoria está ativa e os estados agregados das matrículas vinculadas.' },
  polo: { eyebrow: 'Visão institucional', description: 'Acompanhe a operação da organização com informações autorizadas e dados disponíveis.' },
} as const

export function AuthenticatedDashboard({ role, displayName, organizationName, organizationSlug, learningData, learningDataFailed = false, teacherData, teacherDataFailed = false, launchReadiness, launchReadinessFailed = false, poloAccess, poloBranding }: { role: XpexRole; displayName: string; organizationName?: string; organizationSlug: string; learningData?: XpexLearningDashboardData | null; learningDataFailed?: boolean; teacherData?: XpexTeacherDashboardData | null; teacherDataFailed?: boolean; launchReadiness?: XpexLaunchReadinessData | null; launchReadinessFailed?: boolean; poloAccess?: XpexPoloAccess | null; poloBranding?: PoloBranding }) {
  const title = role === 'polo' && organizationName ? organizationName : `Olá, ${displayName}.`
  return <div className="xpex-dashboard">
    {role === 'polo' ? <PoloIdentityHero branding={poloBranding ?? { organization_name: organizationName ?? 'Organização atual' }}/> : <XpexRoleHero eyebrow={`${copy[role].eyebrow}${organizationName ? ` · ${organizationName}` : ''}`} title={title} description={copy[role].description}/>}
    {role === 'aluno' ? <StudentDashboard data={learningData} failed={learningDataFailed} organizationName={organizationName} organizationSlug={organizationSlug}/> : role === 'professora' ? <TeacherDashboard data={teacherData} failed={teacherDataFailed} organizationName={organizationName}/> : <UnifiedPoloDashboard organizationName={organizationName} organizationSlug={organizationSlug} data={launchReadiness} failed={launchReadinessFailed} teacherData={teacherData} teacherFailed={teacherDataFailed} access={poloAccess}/>}
  </div>
}

function UnifiedPoloDashboard({ access, teacherData, teacherFailed, ...poleProps }: { access?: XpexPoloAccess | null; teacherData?: XpexTeacherDashboardData | null; teacherFailed: boolean; organizationName?: string; organizationSlug: string; data?: XpexLaunchReadinessData | null; failed: boolean }) {
  return <>
    {access?.isManager ? <PoleDashboard {...poleProps}/> : null}
    {access?.isTeacher ? <section aria-label="Operação pedagógica integrada"><XpexSectionHeader eyebrow="Ensino" title="Minha atuação pedagógica"/><TeacherDashboard data={teacherData} failed={teacherFailed} organizationName={poleProps.organizationName}/></section> : null}
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
    <section aria-label="Próximas ações"><XpexSectionHeader eyebrow="Agora" title="Próxima ação"/><div className="xpex-entry-grid">{current ? <Link href={current.target_href} className="xpex-card xpex-next-action"><Route aria-hidden="true"/><div><strong>{currentCompleted ? `Revisar ${current.title}` : `Continuar ${current.title}`}</strong><span>{currentCompleted ? 'Curso concluído. Revise o conteúdo quando quiser.' : 'Retome sua próxima atividade disponível.'}</span></div></Link> : courses[0] ? <Link href={courses[0].target_href} className="xpex-card xpex-next-action"><BookOpen aria-hidden="true"/><div><strong>Abrir {courses[0].title}</strong><span>Conheça as atividades liberadas para sua matrícula.</span></div></Link> : <XpexEmptyState compact title="Nenhuma ação disponível" description="Assim que sua matrícula liberar um curso, sua próxima ação aparecerá aqui."/>}</div></section>
    <EntryPoints role="aluno" organizationSlug={organizationSlug}/>
  </>
}

function TeacherDashboard({ data, failed, organizationName }: { data?: XpexTeacherDashboardData | null; failed: boolean; organizationName?: string }) {
  if (failed || !data) return <XpexErrorState title="Não foi possível carregar sua visão pedagógica" description="Tente novamente em instantes. Nenhum dado de aluno foi exposto fora do seu escopo autorizado."/>
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
    <XpexPanel id="atividades"><XpexSectionHeader eyebrow="Privacidade" title="Visão agregada por padrão"/><p className="mt-3 text-sm text-slate-400">Este painel não lista nomes, e-mails ou dados pessoais de estudantes. Ele resume somente estados de matrícula dos cursos em que sua autoria está ativa.</p></XpexPanel>
  </>
}

function LearningMetric({ label, value }: { label: string; value: number }) {
  return <div className="xpex-learning-metric"><span>{label}</span><strong>{value}</strong></div>
}

function PoleDashboard({ organizationName, organizationSlug, data, failed }: { organizationName?: string; organizationSlug: string; data?: XpexLaunchReadinessData | null; failed: boolean }) {
  if (failed) return <XpexErrorState title="Não foi possível carregar os indicadores operacionais" description="Atualize em instantes para carregar novamente os dados persistidos da organização."/>
  return <>
    {data ? <XpexKpiGrid>
      <XpexMetricCard icon={BookOpen} label="Cursos publicados" value={String(data.metrics.published_courses)} detail="Cursos disponíveis na organização"/>
      <XpexMetricCard icon={Route} label="Atividades publicadas" value={String(data.metrics.published_activities)} detail="Aulas e atividades publicadas"/>
      <XpexMetricCard icon={Users} label="Alunos matriculados" value={String(data.metrics.enrolled_students)} detail="Matrículas registradas"/>
      <XpexMetricCard icon={GraduationCap} label="Professoras" value={String(data.metrics.teachers)} detail="Perfis de instrutora vinculados" tone="orange"/>
    </XpexKpiGrid> : <XpexEmptyState title="Indicadores indisponíveis" description="O snapshot operacional ainda não está disponível para esta organização."/>}
    <section><XpexSectionHeader eyebrow="Operação" title="Ações rápidas"/><div className="xpex-actions">
      <XpexQuickAction icon={GraduationCap} title="Nova turma" href="/xpex/polo/turmas" detail="Gerenciar turmas"/>
      <XpexQuickAction icon={BookOpen} title="Novo curso" href="/xpex/polo/cursos" detail="Gerenciar cursos"/>
      <XpexQuickAction icon={Users} title="Novo aluno" href="/xpex/polo/alunos" detail="Convidar e matricular"/>
      <XpexQuickAction icon={FilePlus2} title="Relatórios" href="/xpex/polo/relatorios" detail="Consultar indicadores"/>
    </div></section>
    {data ? <XpexPanel id="atividades"><XpexSectionHeader eyebrow="Acompanhamento" title="Estado de aprendizagem"/><div className="mt-5 grid gap-3 sm:grid-cols-3"><LearningMetric label="Alunos ativos" value={data.metrics.active_students}/><LearningMetric label="Atividades concluídas" value={data.metrics.completed_activities}/><LearningMetric label="Cursos concluídos" value={data.metrics.completed_students}/></div></XpexPanel> : null}
    <EntryPoints role="polo" organizationSlug={organizationSlug}/>
  </>
}

function EntryPoints({ role, organizationSlug }: { role: XpexRole; organizationSlug?: string }) {
  if (role === 'polo' && organizationSlug) return <section aria-label="Acessos operacionais"><XpexSectionHeader eyebrow="Acesso rápido" title="Explore o ecossistema"/><div className="xpex-entry-grid"><Link href="/xpex/polo/cursos" className="xpex-card block p-5"><span className="xpex-label">Operacional</span><h3 className="mt-2 text-lg font-black text-white">Cursos</h3><p className="mt-2 text-sm text-slate-400">Gerencie o catálogo da organização.</p><span className="xpex-primary mt-4">Abrir cursos</span></Link></div></section>
  if (role === 'aluno') return <section aria-label="Acessos do aluno"><XpexSectionHeader eyebrow="Acesso rápido" title="Explore sua jornada"/><div className="xpex-entry-grid"><Link href={xpexLearnerCoursesRoute()} className="xpex-card block p-5"><span className="xpex-label">Catálogo disponível</span><h3 className="mt-2 text-lg font-black text-white">Cursos</h3><p className="mt-2 text-sm text-slate-400">Acesse os cursos publicados e autorizados para sua matrícula.</p><span className="xpex-primary mt-4">Ver cursos</span></Link><Link href="/xpex/trails" className="xpex-card block p-5"><span className="xpex-label">Jornada</span><h3 className="mt-2 text-lg font-black text-white">Trilhas</h3><p className="mt-2 text-sm text-slate-400">Acompanhe as trilhas disponíveis para sua organização.</p><span className="xpex-primary mt-4">Abrir trilhas</span></Link><Link href="/xpex/ai-lab" className="xpex-card block p-5"><span className="xpex-label">Prática com IA</span><h3 className="mt-2 text-lg font-black text-white">Laboratório de IA</h3><p className="mt-2 text-sm text-slate-400">Use as ferramentas liberadas no ambiente de aprendizagem.</p><span className="xpex-primary mt-4">Abrir laboratório</span></Link></div></section>
  return null
}
