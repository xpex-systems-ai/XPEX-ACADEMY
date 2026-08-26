import Link from 'next/link'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'
import { getServerSession } from '@/lib/auth/server'
import { getOrganizationContextInfo } from '@services/organizations/orgs'
import { getCommunities, type Community } from '@services/communities/communities'

export default async function XpexCommunityPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/community')
  if (!learning) return <XpexStudentDenied />

  const session = await getServerSession()
  const accessToken = session?.tokens?.access_token
  let communities: Community[] = []

  try {
    const organization = await getOrganizationContextInfo(
      learning.organization.slug,
      { revalidate: 60 },
      accessToken,
    )
    communities = (await getCommunities(
      organization.id,
      1,
      100,
      { revalidate: 60 },
      accessToken,
    )) as Community[]
  } catch {
    communities = []
  }

  return (
    <XpexAuthenticatedShell
      role="aluno"
      allowedRoles={['aluno']}
      displayName={learning.displayName}
      organizationSlug={learning.organization.slug}
    >
      <section className="xpex-native-page">
        <header>
          <p className="xpex-label">Conecte e colabore</p>
          <h1>Comunidade XPeX</h1>
          <p>Espaço para dúvidas, projetos, desafios e evolução coletiva.</p>
        </header>
        {communities.length > 0 ? (
          <div className="xpex-course-grid">
            {communities.map((community) => (
              <article className="xpex-card" key={community.community_uuid}>
                <span className="xpex-badge">Comunidade</span>
                <h2>{community.name}</h2>
                <p>{community.description || 'Participe das discussões e compartilhe sua evolução.'}</p>
                <Link className="xpex-primary" href={`/community/${community.community_uuid}`}>
                  Entrar na comunidade
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="xpex-card xpex-empty">
            <h2>Comunidade pronta para o primeiro curso</h2>
            <p>Quando uma comunidade for publicada, ela aparecerá aqui automaticamente.</p>
          </div>
        )}
      </section>
    </XpexAuthenticatedShell>
  )
}
