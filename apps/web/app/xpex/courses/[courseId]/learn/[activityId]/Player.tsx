'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useTransition } from 'react'
import type { XpexLearningActivity } from '@/lib/xpex/learning-dashboard'
import { completeXpexActivity } from './actions'

const VideoActivity = dynamic(() => import('@components/Objects/Activities/Video/Video'), { ssr: false })

export function Player({ courseId, courseUuid, orgUuid, activity, previous, next }: { courseId: string; courseUuid: string; orgUuid: string; activity: XpexLearningActivity; previous?: XpexLearningActivity; next?: XpexLearningActivity }) {
  const [pending, startTransition] = useTransition()
  const path = (item: XpexLearningActivity) => `/xpex/courses/${courseId}/learn/${item.activity_uuid.replace('activity_', '')}`
  return <article className="xpex-player"><header><div><small>{activity.chapter_name}</small><h1>{activity.name}</h1></div><Link href={`/xpex/courses/${courseId}`}>Voltar ao curso</Link></header><div className="xpex-player-stage">{activity.activity_type === 'TYPE_VIDEO' ? <VideoActivity activity={activity as never} course={{ course_uuid: courseUuid }} orgUuid={orgUuid} /> : <div className="xpex-empty"><h2>Atividade disponível</h2><p>Abra o conteúdo pelo formato indicado no curso. Este formato continuará usando o renderizador canônico do LearnHouse.</p></div>}</div><footer>{previous ? <Link href={path(previous)}>← Anterior</Link> : <span />}{!activity.complete && <button disabled={pending} onClick={() => startTransition(async () => { await completeXpexActivity(courseId, activity.activity_uuid.replace('activity_', '')) })}>{pending ? 'Salvando…' : 'Marcar como concluída'}</button>}{next ? <Link href={path(next)}>Próxima →</Link> : <Link href={`/xpex/courses/${courseId}`}>Concluir curso</Link>}</footer></article>
}
