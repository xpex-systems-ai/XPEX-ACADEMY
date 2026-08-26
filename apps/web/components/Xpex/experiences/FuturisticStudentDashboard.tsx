import {
  Award,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CirclePlay,
  Code2,
  Compass,
  FlaskConical,
  GraduationCap,
  LayoutGrid,
  Route,
  Search,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import type { XpexLearningCourse, XpexLearningDashboardData } from '@/lib/xpex/learning-dashboard'
import { getCourseThumbnailMediaDirectory } from '@services/media/media'
import { XpexErrorState } from '../XpexPrimitives'
import './futuristic-student.css'

const imageUrl = (course: XpexLearningCourse) =>
  course.image_url
    ? getCourseThumbnailMediaDirectory(course.org_uuid, course.course_id, course.image_url)
    : null

const statusLabel = (course: XpexLearningCourse) => {
  if (course.enrollment_state === 'STATUS_PAUSED') return 'Pausado'
  if (course.enrollment_state === 'STATUS_COMPLETED') return 'Concluído'
  if (course.completed_lessons > 0) return 'Em andamento'
  return 'Não iniciado'
}

function CourseCard({ course, featured = false }: { course: XpexLearningCourse; featured?: boolean }) {
  const progress = course.progress_percent ?? 0
  const picture = imageUrl(course)
  return (
    <Link href={course.target_href} className={`xpex-f-course ${featured ? 'is-featured' : ''}`}>
      <div className="xpex-f-course-media">
        {picture ? <img src={picture} alt="" /> : <div className="xpex-f-course-fallback"><BrainCircuit aria-hidden="true" /></div>}
        <span className="xpex-f-status">{statusLabel(course)}</span>
      </div>
      <div className="xpex-f-course-body">
        <strong>{course.title}</strong>
        <span>{course.completed_lessons} de {course.total_lessons} aulas concluídas</span>
        <div className="xpex-f-progress"><i style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /></div>
        <small>{course.progress_percent === null ? 'Progresso disponível após a primeira atividade' : `${course.progress_percent}% concluído`}</small>
      </div>
    </Link>
  )
}

function EmptyCourseState({ organizationSlug }: { organizationSlug: string }) {
  return (
    <div className="xpex-f-empty">
      <BookOpen aria-hidden="true" />
      <div><strong>Sua jornada começa aqui</strong><span>Nenhum curso matriculado está disponível para esta conta agora.</span></div>
      <Link href={`/orgs/${organizationSlug}/courses`}>Explorar cursos <ChevronRight size={16} /></Link>
    </div>
  )
}

export function FuturisticStudentDashboard({
  displayName,
  organizationName,
  organizationSlug,
  data,
  failed,
}: {
  displayName: string
  organizationName?: string
  organizationSlug: string
  data?: XpexLearningDashboardData | null
  failed?: boolean
}) {
  if (failed) {
    return <XpexErrorState title="Não foi possível carregar sua jornada" description="Tente novamente em instantes. Seus dados continuam protegidos e nenhuma informação simulada foi exibida." />
  }

  const courses = data?.courses ?? []
  const current = data?.continue_learning ?? courses[0]
  const summary = data?.summary
  const firstName = displayName.split(/\s+/)[0] || displayName
  const overall = summary?.overall_progress_percent

  return (
    <div className="xpex-f-dashboard" id="visao-geral">
      <section className="xpex-f-hero">
        <div className="xpex-f-hero-copy">
          <span className="xpex-f-kicker">{organizationName ?? data?.organization ?? 'XpeX Academy'}</span>
          <p>Bem-vindo(a) de volta,</p>
          <h1>{firstName}!</h1>
          <h2>Continue sua jornada e construa o futuro que você imagina.</h2>
          {current ? (
            <Link href={current.target_href} className="xpex-f-primary">Continuar aprendendo <CirclePlay size={17} /></Link>
          ) : (
            <Link href={`/orgs/${organizationSlug}/courses`} className="xpex-f-primary">Explorar cursos <Compass size={17} /></Link>
          )}
          <div className="xpex-f-overall">
            <div><span>Seu progresso geral</span><strong>{overall === null || overall === undefined ? '—' : `${overall}% concluído`}</strong></div>
            <div className="xpex-f-progress"><i style={{ width: `${overall ?? 0}%` }} /></div>
          </div>
        </div>
        <div className="xpex-f-hero-art" aria-hidden="true">
          <div className="xpex-f-orbit orbit-a"/><div className="xpex-f-orbit orbit-b"/><div className="xpex-f-xmark"><span>X</span></div>
          <div className="xpex-f-gridglow" />
        </div>
      </section>

      <section className="xpex-f-kpis" aria-label="Indicadores reais da aprendizagem">
        <div><BookOpen/><span><strong>{courses.length}</strong>Cursos matriculados</span></div>
        <div><GraduationCap/><span><strong>{summary?.active_courses ?? 0}</strong>Cursos em andamento</span></div>
        <div><CheckCircle2/><span><strong>{summary?.completed_lessons ?? 0}</strong>Aulas concluídas</span></div>
        <div><Route/><span><strong>{summary?.total_lessons ?? 0}</strong>Aulas disponíveis</span></div>
      </section>

      <div className="xpex-f-layout">
        <div className="xpex-f-main">
          <section id="cursos" className="xpex-f-section">
            <div className="xpex-f-heading"><div><span>Minha jornada</span><h2>Meus cursos</h2></div><Link href="/xpex/courses">Ver todos <ChevronRight size={15}/></Link></div>
            {courses.length ? <div className="xpex-f-course-grid">{courses.slice(0, 5).map(course => <CourseCard key={course.course_id} course={course} featured={course.course_id === current?.course_id} />)}</div> : <EmptyCourseState organizationSlug={organizationSlug}/>} 
          </section>

          <section className="xpex-f-section">
            <div className="xpex-f-heading"><div><span>Acesso rápido</span><h2>Explorar</h2></div></div>
            <div className="xpex-f-explore">
              <Link href={`/orgs/${organizationSlug}/courses`}><BookOpen/><strong>Todos os cursos</strong><span>Conteúdo publicado</span></Link>
              <Link href={`/orgs/${organizationSlug}/copilot`}><FlaskConical/><strong>Laboratório de IA</strong><span>Copiloto da organização</span></Link>
              <Link href={`/orgs/${organizationSlug}/communities`}><Users/><strong>Comunidade</strong><span>Conecte e colabore</span></Link>
              <Link href="/xpex/activities"><LayoutGrid/><strong>Atividades</strong><span>Sua aprendizagem</span></Link>
              <Link href={`/orgs/${organizationSlug}/certificates`}><Award/><strong>Certificados</strong><span>Conquistas registradas</span></Link>
            </div>
          </section>

          <section className="xpex-f-section xpex-f-truth">
            <Sparkles aria-hidden="true"/>
            <div><strong>Dados reais, experiência premium</strong><span>Indicadores, progresso e ações acima são derivados da sua matrícula e das atividades publicadas. Recursos sem integração disponível não recebem números fictícios.</span></div>
          </section>
        </div>

        <aside className="xpex-f-rail">
          <section className="xpex-f-ai" id="gx">
            <div className="xpex-f-rail-title"><Bot/><span><small>Assistente IA</small><strong>GX está online</strong></span></div>
            <div className="xpex-f-ai-message"><BrainCircuit/><p>Olá, {firstName}! Posso te ajudar a estudar, revisar conteúdos e organizar seu próximo passo.</p></div>
            <Link href={`/orgs/${organizationSlug}/copilot`}>Abrir GX <ChevronRight size={16}/></Link>
            <Link href={`/orgs/${organizationSlug}/copilot`} className="secondary">Explique um conteúdo</Link>
            <Link href={`/orgs/${organizationSlug}/copilot`} className="secondary">Crie um plano de estudos</Link>
          </section>

          <section className="xpex-f-side-card">
            <div className="xpex-f-heading compact"><div><span>Próximo passo</span><h2>{current ? 'Retome seus estudos' : 'Descubra um curso'}</h2></div></div>
            {current ? <CourseCard course={current} featured/> : <p>Nenhuma aula ao vivo ou atividade futura foi publicada para sua conta.</p>}
          </section>

          <section className="xpex-f-side-card">
            <div className="xpex-f-heading compact"><div><span>Academy</span><h2>Tecnologia que liberta</h2></div></div>
            <div className="xpex-f-values"><span><Zap/>Aprenda no seu ritmo</span><span><Code2/>Construa projetos reais</span><span><Search/>Explore novas habilidades</span></div>
          </section>
        </aside>
      </div>
    </div>
  )
}
