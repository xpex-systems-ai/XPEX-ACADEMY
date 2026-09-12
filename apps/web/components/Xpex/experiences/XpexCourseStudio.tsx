'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, FilePenLine, Loader2, RefreshCw, Rocket, Sparkles } from 'lucide-react'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import {
  approveCourseStudioDraft,
  type CourseStudioDraft,
  editCourseStudioDraft,
  generateCourseStudioDraft,
  listCourseStudioDrafts,
  publishCourseStudioDraft,
  reviewCourseStudioDraft,
} from '@services/xpex/courseStudio'

interface StudioLesson {
  title: string
  objective: string
}

interface StudioModule {
  title: string
  outcome: string
  lessons: StudioLesson[]
}

interface StudioDraftContent {
  title: string
  description: string
  modules: StudioModule[]
}

interface StudioReviewNote {
  area: string
  severity: 'BLOCKER' | 'WARNING' | string
  note: string
}

interface StudioReview {
  notes: StudioReviewNote[]
}

const statusLabel: Record<CourseStudioDraft['status'], string> = {
  DRAFT: 'Rascunho',
  REVIEWED: 'Revisado',
  APPROVED: 'Aprovado',
  PUBLISHED: 'Publicado',
}

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

export function XpexCourseStudio({ orgslug, organizationName }: { orgslug: string; organizationName?: string }) {
  const session = useLHSession()
  const accessToken = session?.data?.tokens?.access_token as string | undefined
  const [topic, setTopic] = useState('Fundamentos de Inteligência Artificial Aplicada')
  const [audience, setAudience] = useState('alunos iniciantes da XPeX Academy')
  const [moduleCount, setModuleCount] = useState(1)
  const [drafts, setDrafts] = useState<CourseStudioDraft[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const selected = useMemo(
    () => drafts.find((draft) => draft.draft_id === selectedId) ?? drafts[0] ?? null,
    [drafts, selectedId],
  )
  const selectedContent = selected?.draft as StudioDraftContent | undefined
  const selectedReview = selected?.review as StudioReview | null | undefined

  const load = useCallback(async () => {
    if (!accessToken) return
    try {
      const data = await listCourseStudioDrafts(orgslug, accessToken)
      setDrafts(data)
      setSelectedId((current) => current || data[0]?.draft_id || '')
      setError('')
    } catch (loadError) {
      setError(errorMessage(loadError, 'Não foi possível carregar os cursos em preparação.'))
    }
  }, [accessToken, orgslug])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setEditTitle(selectedContent?.title ?? '')
    setEditDescription(selectedContent?.description ?? '')
  }, [selected?.draft_id, selected?.revision, selectedContent?.title, selectedContent?.description])

  const replaceDraft = (draft: CourseStudioDraft) => {
    setDrafts((current) => [draft, ...current.filter((item) => item.draft_id !== draft.draft_id)])
    setSelectedId(draft.draft_id)
  }

  const run = async (label: string, action: () => Promise<CourseStudioDraft>) => {
    setBusy(label)
    setError('')
    try {
      replaceDraft(await action())
    } catch (actionError) {
      setError(errorMessage(actionError, 'A operação não pôde ser concluída.'))
    } finally {
      setBusy('')
    }
  }

  const generate = async () => {
    if (!accessToken || topic.trim().length < 3 || audience.trim().length < 3) return
    await run('generate', () => generateCourseStudioDraft({
      organization_slug: orgslug,
      topic: topic.trim(),
      audience: audience.trim(),
      module_count: moduleCount,
    }, accessToken))
  }

  const saveEdit = async () => {
    if (!selected || !selectedContent || !accessToken) return
    await run('edit', () => editCourseStudioDraft(
      selected.draft_id,
      selected.revision,
      { ...selectedContent, title: editTitle.trim(), description: editDescription.trim() },
      accessToken,
    ))
  }

  const publish = async () => {
    if (!selected || !accessToken) return
    setBusy('publish')
    setError('')
    try {
      const result = await publishCourseStudioDraft(selected.draft_id, selected.revision, accessToken)
      replaceDraft(result.draft)
    } catch (publishError) {
      setError(errorMessage(publishError, 'A publicação não pôde ser concluída.'))
    } finally {
      setBusy('')
    }
  }

  const blockers = selectedReview?.notes?.filter((note) => note.severity === 'BLOCKER') ?? []
  const editChanged = Boolean(
    selectedContent
    && (editTitle.trim() !== selectedContent.title || editDescription.trim() !== selectedContent.description),
  )

  return (
    <section className="space-y-6" aria-label="Fábrica de Cursos IA">
      <div className="overflow-hidden rounded-[28px] border border-cyan-400/15 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,122,0,.13),transparent_35%),#07111f] p-6 shadow-2xl md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">
              <Sparkles size={14} aria-hidden="true" /> XPeX AI Course Studio
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">Fábrica de Cursos IA</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Crie, revise, aprove e publique cursos dentro da XPeX. O motor acadêmico continua operando em segundo plano sem expor sua interface ao polo.
            </p>
            {organizationName ? <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{organizationName}</p> : null}
          </div>
          <button type="button" onClick={() => void load()} disabled={!accessToken || busy !== ''} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-40">
            <RefreshCw size={16} aria-hidden="true" /> Atualizar
          </button>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-5 shadow-xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-400/10 text-orange-300"><Sparkles size={19} aria-hidden="true" /></span>
              <div><h2 className="font-black text-white">Novo curso</h2><p className="text-xs text-slate-500">Geração assistida por IA</p></div>
            </div>
            <label className="mb-4 block text-xs font-bold uppercase tracking-wider text-slate-400">Tema
              <input value={topic} onChange={(event) => setTopic(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm font-medium text-white outline-none transition focus:border-cyan-400/40" />
            </label>
            <label className="mb-4 block text-xs font-bold uppercase tracking-wider text-slate-400">Público
              <textarea value={audience} onChange={(event) => setAudience(event.target.value)} rows={3} className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40" />
            </label>
            <label className="mb-5 block text-xs font-bold uppercase tracking-wider text-slate-400">Módulos
              <input type="number" min={1} max={12} value={moduleCount} onChange={(event) => setModuleCount(Math.min(12, Math.max(1, Number(event.target.value))))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white" />
            </label>
            <button type="button" onClick={() => void generate()} disabled={!accessToken || busy !== ''} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-orange-500/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
              {busy === 'generate' ? <><Loader2 className="animate-spin" size={16} /> Gerando…</> : <><Sparkles size={16} /> Gerar estrutura</>}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black text-white">Cursos em preparação</h2><span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-black text-slate-400">{drafts.length}</span></div>
            <div className="space-y-2">
              {drafts.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">Nenhum curso em preparação.</p> : null}
              {drafts.map((draft) => {
                const content = draft.draft as StudioDraftContent
                const active = selected?.draft_id === draft.draft_id
                return <button type="button" key={draft.draft_id} onClick={() => setSelectedId(draft.draft_id)} className={`w-full rounded-xl border p-3 text-left transition ${active ? 'border-cyan-400/35 bg-cyan-400/5' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                  <div className="flex items-start justify-between gap-2"><span className="line-clamp-2 text-sm font-bold text-slate-100">{content.title}</span><span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-slate-400">{statusLabel[draft.status]}</span></div>
                  <p className="mt-2 text-[11px] text-slate-500">Revisão {draft.revision} · {draft.module_count} módulo(s)</p>
                </button>
              })}
            </div>
          </div>
        </aside>

        <div className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/55 p-5 shadow-xl md:p-6">
          {!selected || !selectedContent ? (
            <div className="grid min-h-[440px] place-items-center text-center"><div><Sparkles className="mx-auto mb-4 text-cyan-300/50" size={34} /><h2 className="text-lg font-black text-white">Pronto para criar</h2><p className="mt-2 text-sm text-slate-500">Gere o primeiro curso ou selecione um rascunho existente.</p></div></div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-300">{statusLabel[selected.status]}</span><span className="text-xs text-slate-600">rev. {selected.revision}</span></div><h2 className="text-2xl font-black text-white">{selectedContent.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{selectedContent.description}</p></div>
                {selected.status === 'PUBLISHED' ? <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-black text-emerald-300"><CheckCircle2 size={17} /> Curso publicado</div> : null}
              </div>

              {selected.status !== 'PUBLISHED' ? <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="flex items-center gap-2 text-sm font-black text-white"><FilePenLine size={16} /> Edição editorial</h3><p className="mt-1 text-xs text-slate-500">Alterações geram uma nova revisão antes da aprovação.</p></div><button type="button" onClick={() => void saveEdit()} disabled={!editChanged || busy !== '' || editTitle.trim().length < 3 || editDescription.trim().length < 40} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-slate-200 disabled:opacity-30">{busy === 'edit' ? 'Salvando…' : 'Salvar edição'}</button></div><input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} className="mb-3 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm font-bold text-white" aria-label="Título do curso" /><textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} rows={4} className="w-full resize-none rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-slate-200" aria-label="Descrição do curso" /></div> : null}

              <div className="grid gap-3 md:grid-cols-3">
                <button type="button" disabled={busy !== '' || selected.status === 'PUBLISHED' || editChanged} onClick={() => accessToken && void run('review', () => reviewCourseStudioDraft(selected.draft_id, selected.revision, accessToken))} className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm font-black text-cyan-200 disabled:opacity-30">{busy === 'review' ? 'Revisando…' : '1. Revisar'}</button>
                <button type="button" disabled={busy !== '' || selected.status !== 'REVIEWED' || blockers.length > 0 || editChanged} onClick={() => accessToken && void run('approve', () => approveCourseStudioDraft(selected.draft_id, selected.revision, accessToken))} className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm font-black text-emerald-200 disabled:opacity-30">{busy === 'approve' ? 'Aprovando…' : '2. Aprovar'}</button>
                <button type="button" disabled={busy !== '' || selected.status !== 'APPROVED' || editChanged} onClick={() => void publish()} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-30"><Rocket size={16} />{busy === 'publish' ? 'Publicando…' : '3. Publicar'}</button>
              </div>

              {selectedReview ? <div><h3 className="mb-3 text-sm font-black text-white">Revisão independente</h3><div className="space-y-2">{selectedReview.notes.length === 0 ? <p className="rounded-xl border border-emerald-400/15 bg-emerald-500/5 p-3 text-sm text-emerald-300">Nenhuma observação registrada.</p> : selectedReview.notes.map((note, index) => <div key={`${note.area}-${index}`} className={`rounded-xl border p-3 text-sm ${note.severity === 'BLOCKER' ? 'border-red-400/20 bg-red-500/5 text-red-200' : note.severity === 'WARNING' ? 'border-amber-400/20 bg-amber-500/5 text-amber-200' : 'border-white/10 bg-white/[0.02] text-slate-300'}`}><span className="mr-2 font-black">{note.severity}</span><span className="font-bold">{note.area}:</span> {note.note}</div>)}</div></div> : null}

              <div><h3 className="mb-3 text-sm font-black text-white">Estrutura do curso</h3><div className="space-y-4">{selectedContent.modules.map((module, moduleIndex) => <div key={`${module.title}-${moduleIndex}`} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"><div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-400/70">Módulo {moduleIndex + 1}</div><h4 className="mt-2 font-black text-white">{module.title}</h4><p className="mt-1 text-sm text-slate-400">{module.outcome}</p><div className="mt-4 grid gap-2 md:grid-cols-2">{module.lessons.map((lesson, lessonIndex) => <div key={`${lesson.title}-${lessonIndex}`} className="rounded-xl border border-white/5 bg-slate-900/70 p-3"><div className="text-sm font-bold text-slate-100">{lesson.title}</div><p className="mt-1 text-xs leading-5 text-slate-500">{lesson.objective}</p></div>)}</div></div>)}</div></div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
