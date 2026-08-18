import { BookOpen, CircleUserRound, Compass, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import type { XpexLearningDashboardData } from '@/lib/xpex/learning-dashboard'
import type { XpexRole } from '../xpex-types'
import {
  XpexBadge,
  XpexHero,
  XpexPanel,
  XpexSectionHeader,
} from '../XpexPrimitives'

const experience = {
  aluno: {
    eyebrow: 'Área do aluno',
    title: 'Seu espaço para aprender e construir.',
    description:
      'Acompanhe aqui cursos, trilhas e projetos vinculados à sua matrícula.',
    section: 'Sua jornada de aprendizagem',
    emptyTitle: 'Sua jornada aparecerá aqui',
    emptyCopy:
      'Ainda não há cursos ou atividades disponíveis para esta conta. Quando uma matrícula for publicada, ela aparecerá neste espaço.',
  },
  professora: {
    eyebrow: 'Painel da turma',
    title: 'Ensino com clareza e presença.',
    description:
      'Organize o trabalho pedagógico e acompanhe somente as turmas autorizadas para sua conta.',
    section: 'Turmas e atividades',
    emptyTitle: 'Nenhuma turma disponível',
    emptyCopy:
      'Ainda não há turmas atribuídas a esta conta. A Academy mostrará alunos e atividades quando uma turma real estiver disponível.',
  },
  polo: {
    eyebrow: 'Visão geral do polo',
    title: 'Operação simples, segura e próxima.',
    description:
      'Acompanhe neste painel os recursos e pessoas vinculados ao polo autorizado para sua conta.',
    section: 'Operação do laboratório',
    emptyTitle: 'Operação ainda sem dados',
    emptyCopy:
      'Dispositivos, turmas e indicadores aparecerão após a integração dos módulos operacionais. Nenhum valor estimado é exibido.',
  },
} as const

export function AuthenticatedDashboard({
  role,
  displayName,
  learningData,
  learningDataFailed = false,
}: {
  role: XpexRole
  displayName: string
  learningData?: XpexLearningDashboardData | null
  learningDataFailed?: boolean
}) {
  const content = experience[role]
  return (
    <div className="space-y-5">
      <XpexHero
        eyebrow={content.eyebrow}
        title={`Olá, ${displayName}.`}
        description={content.description}
      >
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <XpexBadge tone="blue">Acesso autenticado</XpexBadge>
          <span className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={15} /> Experiência definida pela sua permissão
          </span>
        </div>
      </XpexHero>

      <XpexPanel id="workspace">
        <XpexSectionHeader
          eyebrow="Academy OS"
          title={content.section}
          detail={
            <span className="text-xs font-semibold text-slate-500">
              Dados reais, quando disponíveis
            </span>
          }
        />
        {role === 'aluno' && learningData?.courses.length ? (
          <div className="mt-6 space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Cursos ativos" value={learningData.summary.active_courses} />
              <Metric label="Aulas concluídas" value={`${learningData.summary.completed_lessons}/${learningData.summary.total_lessons}`} />
              {learningData.summary.overall_progress_percent !== null && (
                <Metric label="Progresso geral" value={`${learningData.summary.overall_progress_percent}%`} />
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {learningData.courses.map((course) => (
                <article key={course.course_id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Curso da sua matrícula</p>
                  <h2 className="mt-2 text-lg font-black text-white">{course.title}</h2>
                  {course.progress_percent !== null ? (
                    <p className="mt-2 text-sm text-slate-400">{course.completed_lessons} de {course.total_lessons} aulas concluídas · {course.progress_percent}%</p>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">Este curso ainda não possui aulas publicadas para calcular o progresso.</p>
                  )}
                  <Link href={course.target_href} className="mt-5 inline-flex rounded-lg bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950">Continuar aprendendo</Link>
                </article>
              ))}
            </div>
          </div>
        ) : (
        <div className="mt-6 grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/15 bg-black/20 p-8 text-center">
          <div className="max-w-lg">
            <Compass className="mx-auto text-cyan-300" size={38} />
            <h2 className="mt-4 text-xl font-black text-white">
              {learningDataFailed ? 'Não foi possível carregar sua jornada' : role === 'aluno' ? 'Nenhum curso disponível ainda' : content.emptyTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {learningDataFailed ? 'Tente novamente em instantes. Seus dados de aprendizagem permanecem seguros.' : content.emptyCopy}
            </p>
          </div>
        </div>
        )}
      </XpexPanel>

      <div className="grid gap-5 md:grid-cols-2">
        <XpexPanel id="recursos">
          <BookOpen className="text-orange-400" />
          <h2 className="mt-4 font-black text-white">
            Recursos da experiência
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Os módulos do menu identificam a estrutura planejada. Conteúdo e
            indicadores só serão exibidos quando vierem de uma fonte persistida.
          </p>
        </XpexPanel>
        <XpexPanel id="perfil">
          <CircleUserRound className="text-cyan-300" />
          <h2 className="mt-4 font-black text-white">Identidade ativa</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Você está usando a experiência{' '}
            <strong className="text-slate-200">
              {content.eyebrow.toLowerCase()}
            </strong>
            . A troca de URL não concede novas permissões.
          </p>
        </XpexPanel>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-2xl font-black text-white">{value}</p></div>
}
