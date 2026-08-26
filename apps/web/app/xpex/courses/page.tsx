import Link from 'next/link'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'

const categories = [
  'Inteligência Artificial',
  'Criação de Imagens',
  'Criação de Vídeos',
  'Criação de Música',
  'Marketing Digital',
  'Design & Figma',
  'Construção com IA',
  'Computação do Básico',
]

function coursePath(courseId: string) {
  return `/xpex/courses/${courseId.replace('course_', '')}`
}

export default async function CoursesPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/courses')
  if (!learning) return <XpexStudentDenied />

  const courses = learning.data.courses
  const featured = learning.data.continue_learning ?? courses[0] ?? null

  return (
    <XpexAuthenticatedShell
      role="aluno"
      allowedRoles={['aluno']}
      displayName={learning.displayName}
      organizationSlug={learning.organization.slug}
    >
      <main className="min-h-screen bg-[#08090b] text-white">
        <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(124,58,237,0.28),_transparent_36%),linear-gradient(135deg,#0b0c10_0%,#11131a_55%,#17101f_100%)]">
          <div className="mx-auto max-w-7xl px-5 pb-12 pt-10 sm:px-8 sm:pt-14 lg:px-10 lg:pb-16">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-violet-300">XPeX Academy</p>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Sua vitrine de conhecimento.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
                Uma experiência de cursos inspirada em streaming: descubra, continue e conclua jornadas reais de aprendizagem — sempre respeitando sua matrícula e autorização.
              </p>
            </div>

            <div className="mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(category => (
                <span
                  key={category}
                  className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/75"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
          {featured ? (
            <section aria-labelledby="featured-course" className="mb-12">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Continuar assistindo</p>
                  <h2 id="featured-course" className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{featured.title}</h2>
                </div>
                <Link href={coursePath(featured.course_id)} className="hidden rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 sm:inline-flex">
                  Abrir curso
                </Link>
              </div>

              <Link href={coursePath(featured.course_id)} className="group block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 transition duration-300 hover:-translate-y-0.5 hover:border-violet-400/40">
                <div className="grid min-h-[300px] lg:grid-cols-[1.35fr_1fr]">
                  <div className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-slate-950 to-black">
                    {featured.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={featured.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-[1.03]" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/35 to-[#08090b]" />
                    <div className="relative flex h-full flex-col justify-end p-7 sm:p-9">
                      <span className="mb-3 w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/80 backdrop-blur">Em andamento</span>
                      <h3 className="max-w-xl text-3xl font-black tracking-tight sm:text-4xl">{featured.title}</h3>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between p-7 sm:p-9">
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-semibold text-violet-300">{featured.progress_percent ?? 0}% concluído</span>
                        <span className="text-xs text-white/45">{featured.completed_lessons}/{featured.total_lessons} aulas</span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, Math.max(0, featured.progress_percent ?? 0))}%` }} />
                      </div>
                      <p className="mt-6 line-clamp-4 text-sm leading-6 text-white/60">
                        {featured.description || 'Conteúdo disponível para sua jornada de aprendizado.'}
                      </p>
                    </div>
                    <span className="mt-8 inline-flex w-fit items-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition group-hover:bg-violet-300">
                      {featured.completed_lessons ? 'Continuar curso' : 'Começar curso'}
                    </span>
                  </div>
                </div>
              </Link>
            </section>
          ) : null}

          <section aria-labelledby="my-courses">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Catálogo autorizado</p>
                <h2 id="my-courses" className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Meus cursos</h2>
              </div>
              <span className="text-sm text-white/40">{courses.length} {courses.length === 1 ? 'curso' : 'cursos'}</span>
            </div>

            {courses.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {courses.map(course => (
                  <Link
                    key={course.course_id}
                    href={coursePath(course.course_id)}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/[0.07]"
                  >
                    <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-900 to-violet-950">
                      {course.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={course.image_url} alt="" className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-105" />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white/85 backdrop-blur">{course.progress_percent ?? 0}%</span>
                    </div>
                    <div className="p-5">
                      <h3 className="line-clamp-2 text-lg font-bold tracking-tight">{course.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/50">{course.description || 'Conteúdo disponível para sua jornada de aprendizado.'}</p>
                      <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, Math.max(0, course.progress_percent ?? 0))}%` }} />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-white/40">
                        <span>{course.completed_lessons}/{course.total_lessons} aulas</span>
                        <span className="font-semibold text-white/70">Abrir →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.025] px-6 py-14 text-center">
                <h3 className="text-xl font-bold">Seu catálogo ainda está vazio</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/50">Quando uma matrícula em um curso publicado for liberada, o curso aparecerá aqui automaticamente.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </XpexAuthenticatedShell>
  )
}
