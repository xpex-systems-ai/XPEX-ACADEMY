import Link from 'next/link'
import { BookOpen, Search } from 'lucide-react'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'

export default async function XpexSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const learning = await getAuthorizedStudentLearning('/xpex/search')
  if (!learning) return <XpexStudentDenied />

  const params = await searchParams
  const rawQuery = (params.q || '').trim()
  const query = rawQuery.toLocaleLowerCase('pt-BR')
  const courseMatches = query
    ? learning.data.courses.filter((course) =>
        `${course.title} ${course.description || ''}`
          .toLocaleLowerCase('pt-BR')
          .includes(query),
      )
    : learning.data.courses

  const activityMatches = query
    ? learning.data.courses.flatMap((course) =>
        course.activities
          .filter((activity) =>
            `${activity.name} ${activity.chapter_name} ${course.title}`
              .toLocaleLowerCase('pt-BR')
              .includes(query),
          )
          .map((activity) => ({ course, activity })),
      )
    : []

  const hasResults = courseMatches.length > 0 || activityMatches.length > 0

  return (
    <XpexAuthenticatedShell
      role="aluno"
      allowedRoles={['aluno']}
      displayName={learning.displayName}
      organizationSlug={learning.organization.slug}
    >
      <section className="xpex-native-page">
        <header>
          <p className="xpex-label">Busca inteligente</p>
          <h1>Pesquisar na XPeX Academy AI</h1>
          <p>
            {rawQuery
              ? `Resultados para “${rawQuery}”`
              : 'Encontre seus cursos e conteúdos autorizados.'}
          </p>
        </header>

        {courseMatches.length > 0 ? (
          <section aria-labelledby="xpex-search-courses">
            <h2 id="xpex-search-courses" className="text-xl font-black">Cursos</h2>
            <div className="xpex-course-grid">
              {courseMatches.map((course) => (
                <article className="xpex-card xpex-feature xpex-feature-cyan" key={course.course_id}>
                  <Search aria-hidden="true" size={26} />
                  <span className="xpex-badge">{course.progress_percent ?? 0}% concluído</span>
                  <h2>{course.title}</h2>
                  <p>{course.description || 'Conteúdo disponível na sua jornada.'}</p>
                  <Link
                    className="xpex-primary"
                    href={`/xpex/courses/${course.course_id.replace('course_', '')}`}
                  >
                    Abrir curso
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activityMatches.length > 0 ? (
          <section aria-labelledby="xpex-search-activities">
            <h2 id="xpex-search-activities" className="text-xl font-black">Aulas e atividades</h2>
            <div className="xpex-course-grid">
              {activityMatches.map(({ course, activity }) => (
                <article className="xpex-card xpex-feature xpex-feature-orange" key={activity.activity_uuid}>
                  <BookOpen aria-hidden="true" size={26} />
                  <span className="xpex-badge">{activity.complete ? 'Concluída' : 'Disponível'}</span>
                  <h2>{activity.name}</h2>
                  <p>{course.title} · {activity.chapter_name}</p>
                  <Link
                    className="xpex-primary"
                    href={`/xpex/courses/${course.course_id.replace('course_', '')}/learn/${activity.activity_uuid.replace('activity_', '')}`}
                  >
                    Abrir no player
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!hasResults ? (
          <div className="xpex-card xpex-empty">
            <Search aria-hidden="true" size={30} />
            <h2>Nenhum resultado encontrado</h2>
            <p>Tente outro termo ou explore os cursos disponíveis.</p>
            <Link className="xpex-primary" href="/xpex/courses">
              Ver meus cursos
            </Link>
          </div>
        ) : null}
      </section>
    </XpexAuthenticatedShell>
  )
}
