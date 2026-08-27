'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  approveVideoJob,
  attachVideoJob,
  createVideoBatch,
  listVideoJobs,
  processVideoJob,
  publishVideoJob,
  VideoStudioJob,
} from '@services/xpex/courseStudio'

const stateLabel: Record<string, string> = {
  QUEUED: 'Na fila',
  SCRIPTING: 'Roteiro',
  STORYBOARDING: 'Storyboard',
  NARRATING: 'Narração',
  ASSET_GENERATION: 'Visual',
  RENDERING: 'Renderizando',
  REVIEWING: 'Revisão IA',
  AWAITING_HUMAN_APPROVAL: 'Aguardando aprovação',
  APPROVED: 'Aprovado',
  ATTACHED: 'Anexado (não publicado)',
  PUBLISHED: 'Publicado',
  FAILED: 'Falhou com segurança',
  CANCELLED: 'Cancelado',
}

function nextAction(job: VideoStudioJob) {
  if (job.state === 'QUEUED' || job.state === 'FAILED') return 'process'
  if (job.state === 'AWAITING_HUMAN_APPROVAL') return 'approve'
  if (job.state === 'APPROVED') return 'attach'
  if (job.state === 'ATTACHED') return 'publish'
  return null
}

function actionLabel(action: string | null) {
  if (action === 'process') return 'Gerar e revisar vídeo'
  if (action === 'approve') return 'Aprovar vídeo'
  if (action === 'attach') return 'Anexar sem publicar'
  if (action === 'publish') return 'Publicar vídeo'
  return ''
}

export default function VideoStudioPanel({
  draftId,
  accessToken,
}: {
  draftId: string
  accessToken: string
}) {
  const [jobs, setJobs] = useState<VideoStudioJob[]>([])
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setJobs(await listVideoJobs(draftId, accessToken))
      setError('')
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar a fábrica de vídeos.')
    }
  }, [draftId, accessToken])

  useEffect(() => {
    void load()
  }, [load])

  const progress = useMemo(() => {
    const published = jobs.filter((job) => job.state === 'PUBLISHED').length
    const ready = jobs.filter((job) => job.state === 'AWAITING_HUMAN_APPROVAL').length
    return { published, ready }
  }, [jobs])

  const start = async () => {
    setBusy('batch')
    setError('')
    try {
      const result = await createVideoBatch(draftId, accessToken)
      setJobs(result.jobs)
    } catch (err: any) {
      setError(err?.message || 'Não foi possível criar o lote de vídeos.')
    } finally {
      setBusy('')
    }
  }

  const run = async (job: VideoStudioJob) => {
    const action = nextAction(job)
    if (!action) return
    const key = `${job.job_id}:${action}`
    setBusy(key)
    setError('')
    try {
      let updated: VideoStudioJob
      if (action === 'process') updated = await processVideoJob(job.job_id, accessToken)
      else if (action === 'approve') updated = await approveVideoJob(job.job_id, accessToken)
      else if (action === 'attach') updated = await attachVideoJob(job.job_id, accessToken)
      else updated = await publishVideoJob(job.job_id, accessToken)
      setJobs((current) => current.map((item) => (item.job_id === updated.job_id ? updated : item)))
    } catch (err: any) {
      setError(err?.message || 'A operação de vídeo falhou com segurança.')
      await load()
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="rounded-2xl border border-cyan-200 bg-cyan-50/40 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">XPeX AI Video Lesson Factory</div>
          <h3 className="mt-1 text-lg font-bold text-slate-950">Vídeo-aulas com revisão e publicação humana</h3>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">
            Cada aula passa por roteiro, narração, visual, render, transcrição e revisão multimodal. Aprovar, anexar e publicar permanecem ações humanas separadas.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void load()} disabled={busy !== ''} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-40">
            Atualizar
          </button>
          <button onClick={start} disabled={busy !== ''} className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">
            {busy === 'batch' ? 'Preparando…' : jobs.length ? 'Sincronizar lote' : 'Criar lote de vídeo-aulas'}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}

      {jobs.length > 0 && (
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-white bg-white p-3 text-xs"><strong>{jobs.length}</strong> aula(s) no lote</div>
          <div className="rounded-xl border border-white bg-white p-3 text-xs"><strong>{progress.ready}</strong> aguardando aprovação</div>
          <div className="rounded-xl border border-white bg-white p-3 text-xs"><strong>{progress.published}</strong> vídeo(s) publicado(s)</div>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cyan-200 bg-white/70 p-5 text-sm text-slate-600">
          O curso está publicado. Crie o lote para gerar até 24 vídeo-aulas de forma retomável.
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job, index) => {
            const action = nextAction(job)
            const blockers = job.manifest?.review?.notes?.filter((note: any) => note.severity === 'BLOCKER') || []
            return (
              <div key={job.job_id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Aula {index + 1} · {job.lesson_id}</div>
                    <div className="truncate text-sm font-semibold text-slate-900">{job.lesson_title}</div>
                    <div className="mt-1 text-xs text-slate-500">{stateLabel[job.state] || job.state} · tentativa {job.attempt_count}/5</div>
                  </div>
                  {action && (
                    <button
                      onClick={() => void run(job)}
                      disabled={busy !== '' || (action === 'approve' && blockers.length > 0)}
                      className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      {busy === `${job.job_id}:${action}` ? 'Executando…' : actionLabel(action)}
                    </button>
                  )}
                </div>
                {job.last_error && <div className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-800">{job.last_error}</div>}
                {blockers.length > 0 && (
                  <div className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-800">
                    {blockers.length} BLOCKER(s) impedem aprovação. Gere novamente após corrigir a origem editorial ou o provider.
                  </div>
                )}
                {job.native_activity_uuid && <div className="mt-2 text-[11px] text-slate-400">atividade nativa: {job.native_activity_uuid}</div>}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
