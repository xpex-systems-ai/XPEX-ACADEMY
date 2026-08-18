import { BookOpen, CircleUserRound, Compass, ShieldCheck } from 'lucide-react'
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
}: {
  role: XpexRole
  displayName: string
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
        <div className="mt-6 grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/15 bg-black/20 p-8 text-center">
          <div className="max-w-lg">
            <Compass className="mx-auto text-cyan-300" size={38} />
            <h2 className="mt-4 text-xl font-black text-white">
              {content.emptyTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {content.emptyCopy}
            </p>
          </div>
        </div>
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
