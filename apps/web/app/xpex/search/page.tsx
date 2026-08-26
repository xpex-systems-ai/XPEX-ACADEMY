import Link from 'next/link'
import { Search } from 'lucide-react'
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
  const courses = query
    ? learning.data.courses.filter((course) =>
        `${course.title} ${course.description || ''}`
          .toLocaleLowerCase('pt-BR')
          .includes(query),
      )
    : learning.data.courses

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
          <h1>Pesquisar na Academy</h1>
          <p>
            {rawQuery
              ? `Resultados para “${rawQuery}”`
              : 'Encontre seus cursos e conteúdos autorizados.'}
          </p>
        </header>
        {courses.length > 0 ? (
          <div className="xpex-course-grid">
            {courses.map((course) => (
              <article className="xpex-card" key={course.course_id}>
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
        ) : (
          <div className="xpex-card xpex-empty">
            <Search aria-hidden="true" size={30} />
            <h2>Nenhum resultado encontrado</h2>
            <p>Tente outro termo ou explore os cursos disponíveis.</p>
            <Link className="xpex-primary" href="/xpex/courses">
              Ver meus cursos
            </Link>
          </div>
        )}
      </section>
    </XpexAuthenticatedShell>
  )
}
