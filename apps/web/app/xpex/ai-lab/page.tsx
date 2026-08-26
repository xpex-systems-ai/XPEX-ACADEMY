import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'
import Copilot from '../../orgs/[orgslug]/(withmenu)/copilot/copilot'

export default async function XpexAiLabPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/ai-lab')
  if (!learning) return <XpexStudentDenied />

  return <XpexAuthenticatedShell role="aluno" allowedRoles={['aluno']} displayName={learning.displayName} organizationSlug={learning.organization.slug}>
    <section className="xpex-native-page">
      <header><p className="xpex-label">Assistente inteligente</p><h1>Laboratório de IA GX</h1><p>Converse com o GX, estude o conteúdo dos cursos e use IA para acelerar sua aprendizagem.</p></header>
      <div className="xpex-card" style={{ padding: 0, overflow: 'hidden' }}><Copilot orgslug={learning.organization.slug} /></div>
    </section>
  </XpexAuthenticatedShell>
}
