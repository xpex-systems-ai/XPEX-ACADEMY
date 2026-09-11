import Link from 'next/link'
import { MessageCircle, ShieldAlert, Users } from 'lucide-react'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'
import { getServerSession } from '@/lib/auth/server'
import { getOrganizationContextInfo } from '@services/organizations/orgs'
import {
  getCommunities,
  getCommunityRights,
  type Community,
} from '@services/communities/communities'

type CommunityWithAccess = {
  community: Community
  canRead: boolean
}

function communityRouteId(communityUuid: string) {
  return communityUuid.replace(/^community_/, '')
}

export default async function XpexCommunityPage() {
  const learning = await getAuthorizedStudentLearning('/xpex/community')
  if (!learning) return <XpexStudentDenied />

  const session = await getServerSession()
  const accessToken = session?.tokens?.access_token
  let communities: CommunityWithAccess[] = []

  try {
    const organization = await getOrganizationContextInfo(
      learning.organization.slug,
      { revalidate: 60 },
      accessToken,
    )
    const available = (await getCommunities(
      organization.id,
      1,
      100,
      { revalidate: 60 },
      accessToken,
    )) as Community[]

    communities = await Promise.all(
      available.map(async (community) => {
        try {
          const rights = await getCommunityRights(community.community_uuid, accessToken)
          return { community, canRead: Boolean(rights.permissions?.read) }
        } catch {
          return { community, canRead: false }
        }
      }),
    )
  } catch {
    communities = []
  }

  return (
    <XpexAuthenticatedShell
      role="aluno"
      allowedRoles={['aluno']}
      displayName={learning.displayName}
      organizationSlug={learning.organization.slug}
      poloBranding={learning.branding}
    >
      <section className="xpex-native-page">
        <header>
          <p className="xpex-label">Conecte e colabore</p>
          <h1>Comunidade</h1>
          <p>Espaço para dúvidas, projetos, desafios e evolução coletiva dentro da identidade do seu Polo.</p>
        </header>
        {communities.length > 0 ? (
          <div className="xpex-course-grid">
            {communities.map(({ community, canRead }) => (
              <article className="xpex-card xpex-feature xpex-feature-orange" key={community.community_uuid}>
                <Users aria-hidden="true" size={30} />
                <span className="xpex-badge">Comunidade</span>
                <h2>{community.name}</h2>
                <p>{community.description || 'Participe das discussões e compartilhe sua evolução.'}</p>
                {canRead ? (
                  <Link
                    className="xpex-primary"
                    href={`/community/${communityRouteId(community.community_uuid)}`}
                  >
                    <MessageCircle aria-hidden="true" size={16} /> Entrar na comunidade
                  </Link>
                ) : (
                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-slate-300">
                    <ShieldAlert aria-hidden="true" className="mt-0.5 shrink-0 text-amber-300" size={18} />
                    <p>Esta comunidade existe, mas ainda não está liberada para a sua matrícula. Quando o acesso for autorizado, o botão de entrada aparecerá aqui.</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="xpex-card xpex-empty">
            <Users aria-hidden="true" size={30} />
            <h2>Comunidade pronta para receber sua turma</h2>
            <p>Quando uma comunidade for publicada para sua organização, ela aparecerá aqui automaticamente.</p>
          </div>
        )}
      </section>
    </XpexAuthenticatedShell>
  )
}
