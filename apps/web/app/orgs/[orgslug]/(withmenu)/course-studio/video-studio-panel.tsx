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

const workflow = [
  { label: 'Course Factory', note: 'curso publicado' },
  { label: 'Video Studio', note: 'lote controlado' },
  { label: 'Gerar', note: 'roteiro + mídia' },
  { label: 'Revisar', note: 'IA + QA' },
  { label: 'Aprovar', note: 'gate humano' },
  { label: 'Publicar', note: 'ação explícita' },
]

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

function isDurableStorageBlocker(message: string | null | undefined) {
  const normalized = (message || '').toLowerCase()
  return normalized.includes('durable media storage') || normalized.includes('storage durável')
}

function stateTone(state: string) {
  if (state === 'PUBLISHED') return 'border-violet-200 bg-violet-50 text-violet-800'
  if (state === 'AWAITING_HUMAN_APPROVAL') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (state === 'APPROVED' || state === 'ATTACHED') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (state === 'FAILED' || state === 'CANCELLED') return 'border-red-200 bg-red-50 text-red-800'
  return 'border-cyan-200 bg-cyan-50 text-cyan-800'
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
    const approved = jobs.filter((job) => job.state === 'APPROVED' || job.state === 'ATTACHED').length
    const failed = jobs.filter((job) => job.state === 'FAILED').length
    return { published, ready, approved, failed }
  }, [jobs])

  const durableStorageBlocked = useMemo(
    () => isDurableStorageBlocker(error) || jobs.some((job) => isDurableStorageBlocker(job.last_error)),
    [error, jobs]
  )

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
    <section id="video-studio" className="scroll-mt-24 rounded-2xl border border-cyan-200 bg-cyan-50/40 p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">XPeX Course Factory · Video Studio</div>
          <h3 className="mt-1 text-xl font-bold text-slate-950">Gerar → Revisar → Aprovar → Publicar</h3>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">
            Produção real de vídeo-aulas com checkpoints persistidos. Gerar/revisar podem ser automatizados; aprovação, anexação e publicação continuam separadas e humanas.
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

      <div className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
        {workflow.map((step, index) => (
          <div key={step.label} className="relative rounded-xl border border-cyan-100 bg-white px-3 py-3 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-wider text-cyan-600">{String(index + 1).padStart(2, '0')}</div>
            <div className="mt-1 text-sm font-black text-slate-950">{step.label}</div>
            <div className="mt-1 text-[11px] text-slate-500">{step.note}</div>
          </div>
        ))}
      </div>

      {durableStorageBlocked && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
          <strong className="block text-sm">Teste real protegido: storage durável de mídia ainda não está configurado.</strong>
          A XPeX está bloqueando a geração antes da chamada ao provider para não perder narração, vídeo ou legendas em um redeploy. Configure um volume/bucket durável e então retome o mesmo job; não é necessário criar outro curso ou outro lote.
        </div>
      )}

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}

      {jobs.length > 0 && (
        <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-white bg-white p-3 text-xs"><strong>{jobs.length}</strong> aula(s) no lote</div>
          <div className="rounded-xl border border-white bg-white p-3 text-xs"><strong>{progress.ready}</strong> aguardando aprovação</div>
          <div className="rounded-xl border border-white bg-white p-3 text-xs"><strong>{progress.approved}</strong> aprovados/anexados</div>
          <div className="rounded-xl border border-white bg-white p-3 text-xs"><strong>{progress.published}</strong> publicados</div>
          <div className="rounded-xl border border-white bg-white p-3 text-xs"><strong>{progress.failed}</strong> bloqueados/falhos</div>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cyan-200 bg-white/70 p-5 text-sm text-slate-600">
          <strong className="block text-slate-900">Video Studio pronto para receber um curso publicado.</strong>
          Criar o lote apenas registra os jobs. A renderização acontece quando você aciona um job individual, preservando o gate humano antes de qualquer publicação.
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job, index) => {
            const action = nextAction(job)
            const blockers = job.manifest?.review?.notes?.filter((note: any) => note.severity === 'BLOCKER') || []
            const jobStorageBlocked = isDurableStorageBlocker(job.last_error)
            const video = job.manifest?.video || job.manifest?.draft || null
            return (
              <article key={job.job_id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Aula {index + 1} · {job.lesson_id}</div>
                    <div className="truncate text-sm font-semibold text-slate-900">{job.lesson_title}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${stateTone(job.state)}`}>{stateLabel[job.state] || job.state}</span>
                      <span className="text-[11px] text-slate-400">tentativa {job.attempt_count}/5</span>
                    </div>
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

                {job.last_error && (
                  <div className={`mt-3 rounded-md p-3 text-xs ${jobStorageBlocked ? 'bg-amber-50 text-amber-900' : 'bg-red-50 text-red-800'}`}>
                    <strong className="mr-1">{jobStorageBlocked ? 'Bloqueio de infraestrutura:' : 'Último erro:'}</strong>{job.last_error}
                  </div>
                )}

                {blockers.length > 0 && (
                  <div className="mt-3 rounded-md bg-red-50 p-3 text-xs text-red-800">
                    {blockers.length} BLOCKER(s) impedem aprovação. Corrija a origem editorial ou técnica antes do gate humano.
                  </div>
                )}

                {(video?.uri || video?.checksum_sha256 || video?.duration_seconds) && (
                  <div className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-600 sm:grid-cols-3">
                    <div><strong className="block text-slate-800">Artefato</strong>{video?.uri ? 'persistido' : 'pendente'}</div>
                    <div><strong className="block text-slate-800">Duração</strong>{video?.duration_seconds ? `${video.duration_seconds}s` : 'pendente'}</div>
                    <div><strong className="block text-slate-800">Checksum</strong>{video?.checksum_sha256 ? String(video.checksum_sha256).slice(0, 14) : 'pendente'}</div>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                  <span>job: {job.job_id}</span>
                  {job.native_activity_uuid && <span>atividade nativa: {job.native_activity_uuid}</span>}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600">
        <strong className="text-slate-900">Regra de produção:</strong> nenhuma etapa automática pode saltar de revisão para publicação. O estado <code>AWAITING_HUMAN_APPROVAL</code> é o gate obrigatório antes de aprovar, anexar e publicar.
      </div>
    </section>
  )
}
