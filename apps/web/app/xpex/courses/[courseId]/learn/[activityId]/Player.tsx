'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useTransition } from 'react'
import type { XpexLearningActivity } from '@/lib/xpex/learning-dashboard'
import { completeXpexActivity } from './actions'

const VideoActivity = dynamic(() => import('@components/Objects/Activities/Video/Video'), { ssr: false })
const DocumentPdfActivity = dynamic(() => import('@components/Objects/Activities/DocumentPdf/DocumentPdf'), { ssr: false })
const MarkdownActivity = dynamic(() => import('@components/Objects/Activities/Markdown/MarkdownActivity'), { ssr: false })
const EmbedActivity = dynamic(() => import('@components/Objects/Activities/Embed/EmbedActivity'), { ssr: false })
const ResourceActivity = dynamic(() => import('@components/Objects/Activities/Resource/ResourceActivity'), { ssr: false })
const DynamicCanva = dynamic(() => import('@components/Objects/Activities/DynamicCanva/DynamicCanva'), { ssr: false })

type PlayerActivity = XpexLearningActivity & { content: Record<string, unknown>; details?: Record<string, unknown> | null; extra_metadata?: Record<string, unknown> | null; published: boolean; is_locked?: boolean }

function ActivityRenderer({ activity, courseUuid, orgUuid, orgSlug }: { activity: PlayerActivity; courseUuid: string; orgUuid: string; orgSlug: string }) {
  if (activity.content?.paid_access === false) return <div className="xpex-empty"><h2>Acesso adicional necessário</h2><p>Este conteúdo não faz parte do seu acesso atual.</p></div>
  if (activity.activity_type === 'TYPE_VIDEO') return <VideoActivity activity={activity as never} course={{ course_uuid: courseUuid }} orgUuid={orgUuid} />
  if (activity.activity_type === 'TYPE_DOCUMENT' && activity.activity_sub_type === 'SUBTYPE_DOCUMENT_PDF') return <DocumentPdfActivity activity={activity} course={{ course_uuid: courseUuid }} orgUuid={orgUuid} />
  if (activity.activity_type === 'TYPE_DYNAMIC' && activity.activity_sub_type === 'SUBTYPE_DYNAMIC_MARKDOWN') return <MarkdownActivity activity={activity} />
  if (activity.activity_type === 'TYPE_DYNAMIC' && activity.activity_sub_type === 'SUBTYPE_DYNAMIC_EMBED') return <EmbedActivity activity={activity} />
  if (activity.activity_type === 'TYPE_DYNAMIC' && activity.activity_sub_type === 'SUBTYPE_DYNAMIC_RESOURCE') return <ResourceActivity activity={activity} orgslug={orgSlug} />
  if (activity.activity_type === 'TYPE_DYNAMIC') return <DynamicCanva content={activity.content as never} activity={activity} courseUuid={courseUuid} orgUuid={orgUuid} />
  if (activity.activity_type === 'TYPE_ASSIGNMENT') return <div className="xpex-empty"><h2>Atividade avaliativa</h2><p>A entrega e a avaliação desta atividade ainda não estão disponíveis no player XPeX. Nenhuma conclusão será registrada aqui.</p></div>
  return <div className="xpex-empty"><h2>Formato indisponível neste player</h2><p>Esta atividade não pode ser aberta ou concluída nesta experiência.</p></div>
}

export function Player({ courseId, courseUuid, orgUuid, orgSlug, activity, activityMeta, previous, next }: { courseId: string; courseUuid: string; orgUuid: string; orgSlug: string; activity: PlayerActivity; activityMeta: XpexLearningActivity; previous?: XpexLearningActivity; next?: XpexLearningActivity }) {
  const [pending, startTransition] = useTransition()
  const path = (item: XpexLearningActivity) => `/xpex/courses/${courseId}/learn/${item.activity_uuid.replace('activity_', '')}`
  const canComplete = activity.content?.paid_access !== false && activity.activity_type !== 'TYPE_ASSIGNMENT' && ['TYPE_VIDEO', 'TYPE_DOCUMENT', 'TYPE_DYNAMIC'].includes(activity.activity_type)
  return <article className="xpex-player">
    <header>
      <div><small>{activityMeta.chapter_name}</small><h1>{activity.name}</h1><p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{activity.activity_type.replace('TYPE_', '')}</p></div>
      <Link href={`/xpex/courses/${courseId}`}>Voltar ao curso</Link>
    </header>
    <div className="xpex-player-stage"><ActivityRenderer activity={activity} courseUuid={courseUuid} orgUuid={orgUuid} orgSlug={orgSlug} /></div>
    <footer>
      {previous ? <Link href={path(previous)}>← Anterior</Link> : <span />}
      <div className="flex items-center gap-3">
        {canComplete && !activityMeta.complete && <button disabled={pending} onClick={() => startTransition(async () => { await completeXpexActivity(courseId, activity.activity_uuid.replace('activity_', '')) })}>{pending ? 'Salvando…' : 'Marcar como concluída'}</button>}
        {activityMeta.complete ? <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">Progresso salvo</span> : null}
      </div>
      {next ? <Link href={path(next)}>Próxima →</Link> : <Link href={`/xpex/courses/${courseId}`}>Concluir curso</Link>}
    </footer>
  </article>
}
