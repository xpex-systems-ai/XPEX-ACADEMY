import Link from 'next/link'
import { ArrowRight, BookOpen, Check, Play, Sparkles } from 'lucide-react'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'
import type { XpexLearningCourse } from '@/lib/xpex/learning-dashboard'

const categories = ['Inteligência Artificial', 'Criação de imagens', 'Criação de vídeos', 'Música', 'Marketing', 'Design & Figma', 'Construção com IA', 'Computação']

const coursePath = (course: XpexLearningCourse) => `/xpex/courses/${course.course_id.replace('course_', '')}`

function CourseArtwork({ course, featured = false }: { course: XpexLearningCourse; featured?: boolean }) {
  return <div className={`xpex-vitrine-artwork ${featured ? 'is-featured' : ''}`}>
    {course.image_url ? <img src={course.image_url} alt="" loading={featured ? 'eager' : 'lazy'} /> : <div className="xpex-vitrine-monogram" aria-hidden="true"><span>XP</span><Sparkles size={22} /></div>}
    <div className="xpex-vitrine-artwork-shade" />
  </div>
}

function CourseCard({ course }: { course: XpexLearningCourse }) {
  const complete = (course.progress_percent ?? 0) >= 100
  const started = course.completed_lessons > 0
  return <article className="xpex-vitrine-card">
    <Link href={coursePath(course)} className="xpex-vitrine-card-link" aria-label={`${started ? 'Continuar' : 'Abrir'} ${course.title}`}>
      <CourseArtwork course={course} />
      <div className="xpex-vitrine-card-copy">
        <div className="xpex-vitrine-meta"><span>{complete ? <><Check size={13} /> Concluído</> : started ? 'Em andamento' : 'Disponível'}</span><span>{course.total_lessons} {course.total_lessons === 1 ? 'aula' : 'aulas'}</span></div>
        <h3>{course.title}</h3>
        <p>{course.description || 'Conteúdo publicado disponível na sua jornada de aprendizado.'}</p>
        <div className="xpex-vitrine-progress"><span style={{ width: `${Math.min(100, Math.max(0, course.progress_percent ?? 0))}%` }} /></div>
        <div className="xpex-vitrine-progress-label"><span>{course.progress_percent ?? 0}% concluído</span><strong>{complete ? 'Revisar' : started ? 'Continuar' : 'Começar'} <ArrowRight size={14} /></strong></div>
      </div>
    </Link>
  </article>
}

export default async function CoursesPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/courses')
  if (!learning) return <XpexStudentDenied />

  const { courses, continue_learning: continueLearning } = learning.data
  const featured = continueLearning ?? courses[0] ?? null
  const remainingCourses = featured ? courses.filter(course => course.course_id !== featured.course_id) : []
  const featuredComplete = (featured?.progress_percent ?? 0) >= 100

  return <XpexAuthenticatedShell role="aluno" allowedRoles={['aluno']} displayName={learning.displayName} organizationSlug={learning.organization.slug}>
    <main className="xpex-vitrine">
      <header className="xpex-vitrine-heading">
        <div><p className="xpex-label">XPeX Academy</p><h1>Sua próxima descoberta começa aqui.</h1><p>Explore somente os cursos publicados e liberados para a sua matrícula.</p></div>
        <div className="xpex-vitrine-trust"><BookOpen aria-hidden="true" size={18} /><span>Catálogo autorizado<br/><strong>{courses.length} {courses.length === 1 ? 'curso disponível' : 'cursos disponíveis'}</strong></span></div>
      </header>

      <nav className="xpex-vitrine-categories" aria-label="Áreas de aprendizagem">
        {categories.map((category, index) => <span className={index === 0 ? 'is-active' : ''} key={category}>{category}</span>)}
      </nav>

      {featured ? <section className="xpex-vitrine-feature" aria-labelledby="featured-course-title">
        <CourseArtwork course={featured} featured />
        <div className="xpex-vitrine-feature-copy">
          <span className="xpex-vitrine-kicker"><Sparkles size={14} /> {continueLearning ? 'Continue aprendendo' : 'Em destaque'}</span>
          <h2 id="featured-course-title">{featured.title}</h2>
          <p>{featured.description || 'Conteúdo publicado e autorizado para a sua jornada.'}</p>
          <div className="xpex-vitrine-feature-facts"><span>{featured.total_lessons} {featured.total_lessons === 1 ? 'aula' : 'aulas'}</span><span>{featured.progress_percent ?? 0}% concluído</span><span>{featuredComplete ? 'Curso concluído' : featured.completed_lessons ? 'Em andamento' : 'Pronto para começar'}</span></div>
          <div className="xpex-vitrine-feature-progress" aria-label={`${featured.progress_percent ?? 0}% concluído`}><span style={{ width: `${Math.min(100, Math.max(0, featured.progress_percent ?? 0))}%` }} /></div>
          <Link className="xpex-vitrine-cta" href={coursePath(featured)}><Play fill="currentColor" size={17} />{featuredComplete ? 'Revisar curso' : featured.completed_lessons ? 'Continuar curso' : 'Começar curso'}</Link>
        </div>
      </section> : <section className="xpex-vitrine-empty" aria-labelledby="empty-catalog-title"><div><BookOpen aria-hidden="true" size={28} /></div><p className="xpex-label">Catálogo do aluno</p><h2 id="empty-catalog-title">Nenhum curso disponível agora</h2><p>Quando uma matrícula ativa for liberada em um curso publicado, o curso aparecerá aqui. A XPeX não exibe conteúdo sem autorização.</p></section>}

      {remainingCourses.length > 0 ? <section className="xpex-vitrine-row" aria-labelledby="your-courses-title"><div className="xpex-vitrine-row-heading"><div><p className="xpex-label">Sua biblioteca</p><h2 id="your-courses-title">Cursos para você</h2></div><span>{remainingCourses.length} {remainingCourses.length === 1 ? 'título' : 'títulos'}</span></div><div className="xpex-vitrine-grid">{remainingCourses.map(course => <CourseCard course={course} key={course.course_id} />)}</div></section> : null}
    </main>
  </XpexAuthenticatedShell>
}
