'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { XpexLearningActivity } from '@/lib/xpex/learning-dashboard'
import { getXpexModuleGuide } from '@/lib/xpex/module-guides'
import { GXModuleGuide } from '@components/Xpex/GXModuleGuide'
import { GXMotionLesson } from '@components/Xpex/GXMotionLesson'
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

export function Player({ courseId, courseUuid, orgUuid, orgSlug, activity, activityMeta, previous, next, lessonNumber, totalLessons, completedLessons }: { courseId: string; courseUuid: string; orgUuid: string; orgSlug: string; activity: PlayerActivity; activityMeta: XpexLearningActivity; previous?: XpexLearningActivity; next?: XpexLearningActivity; lessonNumber: number; totalLessons: number; completedLessons: number }) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(activityMeta.complete)
  const [completionError, setCompletionError] = useState<string | null>(null)
  const [completedNextHref, setCompletedNextHref] = useState<string | null | undefined>(undefined)
  const router = useRouter()
  const path = (item: XpexLearningActivity) => `/xpex/courses/${courseId}/learn/${item.activity_uuid.replace('activity_', '')}`
  const canComplete = activity.content?.paid_access !== false && activity.activity_type !== 'TYPE_ASSIGNMENT' && ['TYPE_VIDEO', 'TYPE_DOCUMENT', 'TYPE_DYNAMIC'].includes(activity.activity_type)
  const guide = getXpexModuleGuide(activityMeta.chapter_name, activity.name)
  const progress = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0

  return <article className="xpex-player" aria-labelledby="lesson-title">
    <div className="xpex-player-progress" aria-label={`Progresso do curso: ${progress}%`}><div><span>Progresso do curso</span><strong>{progress}%</strong></div><progress value={completedLessons} max={totalLessons || 1}>{progress}%</progress></div>
    <header>
      <div><small>{activityMeta.chapter_name || 'Conteúdo do curso'} · Aula {lessonNumber} de {totalLessons}</small><h1 id="lesson-title">{activity.name}</h1><p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{activity.activity_type.replace('TYPE_', '')}</p></div>
      <Link href={`/xpex/courses/${courseId}`} aria-label="Voltar à página do curso">Voltar ao curso</Link>
    </header>
    <div className="xpex-player-stage"><ActivityRenderer activity={activity} courseUuid={courseUuid} orgUuid={orgUuid} orgSlug={orgSlug} /></div>
    {guide ? <GXMotionLesson guide={guide} /> : null}
    {guide ? <GXModuleGuide guide={guide} /> : null}
    <footer>
      {previous ? <Link href={path(previous)}>← Anterior</Link> : <span />}
      <div className="flex items-center gap-3">
        {canComplete && !saved && <button disabled={pending} aria-busy={pending} onClick={() => startTransition(async () => {
          setCompletionError(null)
          try {
            const result = await completeXpexActivity(courseId, activity.activity_uuid.replace('activity_', ''))
            setCompletedNextHref(result.nextHref)
            setSaved(true)
            router.refresh()
          } catch {
            setCompletionError('Não foi possível salvar a conclusão. Tente novamente.')
          }
        })}>{pending ? 'Salvando…' : 'Concluir aula'}</button>}
        {saved ? <span role="status" className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">Progresso salvo · aula concluída</span> : null}
        {completionError ? <span role="alert" className="text-sm font-semibold text-red-300">{completionError}</span> : null}
      </div>
      {next ? <Link href={completedNextHref ?? path(next)}>Próxima →</Link> : <Link href={`/xpex/courses/${courseId}`}>Concluir curso</Link>}
    </footer>
  </article>
}
