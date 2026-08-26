import Link from 'next/link'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'
import { getOrganizationContextInfo } from '@services/organizations/orgs'
import { getCommunities } from '@services/communities/communities'
import { getServerSession } from '@/lib/auth/server'

export default async function XpexCommunityPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/community')
  if (!learning) return <XpexStudentDenied />

  const session = await getServerSession()
  const token = session?.tokens?.access_token
  let communities: any[] = []
  try {
    const org = await getOrganizationContextInfo(learning.organization.slug, { revalidate: 60 }, token)
    communities = await getCommunities(org.id, 1, 100, { revalidate: 60 }, token || undefined) || []
  } catch {
    communities = []
  }

  return <XpexAuthenticatedShell role="aluno" allowedRoles={['aluno']} displayName={learning.displayName} organizationSlug={learning.organization.slug}>
    <section className="xpex-native-page">
      <header><p className="xpex-label">Conecte e colabore</p><h1>Comunidade XPeX</h1><p>Espaço para dúvidas, projetos, desafios e troca entre estudantes.</p></header>
      {communities.length ? <div className="xpex-course-grid">{communities.map((community: any) => <article className="xpex-card" key={community.community_uuid || community.id}><span className="xpex-badge">Comunidade</span><h2>{community.name || community.title || 'Comunidade XPeX'}</h2><p>{community.description || 'Participe das discussões e compartilhe sua evolução.'}</p><Link className="xpex-primary" href={`/community/${community.community_uuid}`}>Entrar na comunidade</Link></article>)}</div> : <div className="xpex-card xpex-empty"><h2>Comunidade pronta para o primeiro curso</h2><p>Assim que uma comunidade for publicada para a organização, ela aparecerá aqui automaticamente.</p></div>}
    </section>
  </XpexAuthenticatedShell>
}
