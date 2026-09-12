import Link from 'next/link'
import { ArrowLeft, LockKeyhole, MessageCircle, Pin, ThumbsUp, Users } from 'lucide-react'
import { notFound } from 'next/navigation'
import { XpexAuthenticatedShell } from '@components/Xpex/XpexAuthenticatedShell'
import { XpexStudentDenied } from '@components/Xpex/XpexStudentStates'
import { getAuthorizedStudentLearning } from '@/lib/xpex/student'
import { getServerSession } from '@/lib/auth/server'
import { getCommunity, getCommunityRights } from '@services/communities/communities'
import { getDiscussions } from '@services/communities/discussions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function XpexCommunityDetailPage({ params }: { params: Promise<{ communityId: string }> }) {
  const { communityId } = await params
  if (!/^[A-Za-z0-9_-]+$/.test(communityId)) notFound()

  const learning = await getAuthorizedStudentLearning(`/xpex/community/${communityId}`)
  if (!learning) return <XpexStudentDenied />

  const session = await getServerSession()
  const accessToken = session?.tokens?.access_token
  if (!accessToken) return <XpexStudentDenied />

  const communityUuid = communityId.startsWith('community_') ? communityId : `community_${communityId}`

  try {
    const rights = await getCommunityRights(communityUuid, accessToken)
    if (!rights.permissions?.read) return <XpexStudentDenied />

    const community = await getCommunity(
      communityUuid,
      { revalidate: 0, tags: ['communities'] },
      accessToken,
    )
    const discussions = await getDiscussions(
      communityUuid,
      'recent',
      1,
      50,
      { revalidate: 0, tags: ['discussions'] },
      accessToken,
    )

    return (
      <XpexAuthenticatedShell
        role="aluno"
        allowedRoles={['aluno']}
        displayName={learning.displayName}
        organizationSlug={learning.organization.slug}
        poloBranding={learning.branding}
      >
        <section className="xpex-native-page pb-14">
          <Link href="/xpex/community" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-slate-400 transition hover:text-white"><ArrowLeft size={16}/> Voltar à comunidade</Link>
          <header className="overflow-hidden rounded-[28px] border border-cyan-400/15 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,122,0,.12),transparent_34%),#07111f] p-6 md:p-8">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-cyan-300"><Users size={23}/></span>
              <div><p className="xpex-label">Comunidade XPeX</p><h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">{community.name}</h1><p className="mt-3 max-w-3xl leading-7 text-slate-300">{community.description || 'Espaço de discussão e colaboração da sua organização.'}</p></div>
            </div>
          </header>

          <section className="mt-7" aria-labelledby="discussoes-xpex">
            <div className="mb-4 flex items-end justify-between gap-4"><div><p className="xpex-label">Feed autorizado</p><h2 id="discussoes-xpex" className="mt-1 text-2xl font-black text-white">Discussões recentes</h2></div><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-400">{discussions.length}</span></div>
            {discussions.length ? <div className="space-y-3">{discussions.map((discussion) => (
              <article key={discussion.discussion_uuid} className="rounded-2xl border border-white/10 bg-slate-950/55 p-5 shadow-xl">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{discussion.is_pinned ? <span className="inline-flex items-center gap-1 text-orange-300"><Pin size={12}/> Fixado</span> : null}<span>{discussion.label || 'geral'}</span>{discussion.is_locked ? <span className="inline-flex items-center gap-1"><LockKeyhole size={12}/> Fechado</span> : null}</div>
                <h3 className="mt-3 text-lg font-black text-white">{discussion.title}</h3>
                {discussion.content ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{discussion.content}</p> : null}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><MessageCircle size={13}/> {discussion.author ? `${discussion.author.first_name} ${discussion.author.last_name}`.trim() || discussion.author.username : 'Membro'}</span><span className="inline-flex items-center gap-1"><ThumbsUp size={13}/> {discussion.upvote_count}</span></div>
              </article>
            ))}</div> : <div className="xpex-card xpex-empty"><MessageCircle size={30}/><h2>Nenhuma discussão publicada</h2><p>Quando a turma iniciar uma conversa autorizada, ela aparecerá aqui.</p></div>}
          </section>
        </section>
      </XpexAuthenticatedShell>
    )
  } catch {
    return <XpexStudentDenied />
  }
}
