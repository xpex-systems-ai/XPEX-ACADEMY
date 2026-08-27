'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import {
  approveCourseStudioDraft,
  CourseStudioDraft,
  editCourseStudioDraft,
  generateCourseStudioDraft,
  listCourseStudioDrafts,
  publishCourseStudioDraft,
  reviewCourseStudioDraft,
} from '@services/xpex/courseStudio'

const badgeClass: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  REVIEWED: 'bg-sky-100 text-sky-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  PUBLISHED: 'bg-violet-100 text-violet-700',
}

export default function CourseStudio({ orgslug }: { orgslug: string }) {
  const session = useLHSession() as any
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
    () => drafts.find((draft) => draft.draft_id === selectedId) || drafts[0] || null,
    [drafts, selectedId]
  )

  const load = useCallback(async () => {
    if (!accessToken) return
    try {
      const data = await listCourseStudioDrafts(orgslug, accessToken)
      setDrafts(data)
      setSelectedId((current) => current || data[0]?.draft_id || '')
      setError('')
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar o Course Studio.')
    }
  }, [accessToken, orgslug])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setEditTitle(selected?.draft.title || '')
    setEditDescription(selected?.draft.description || '')
  }, [selected?.draft_id, selected?.revision, selected?.draft.title, selected?.draft.description])

  const replaceDraft = (draft: CourseStudioDraft) => {
    setDrafts((current) => [draft, ...current.filter((item) => item.draft_id !== draft.draft_id)])
    setSelectedId(draft.draft_id)
  }

  const run = async (label: string, action: () => Promise<CourseStudioDraft>) => {
    setBusy(label)
    setError('')
    try {
      replaceDraft(await action())
    } catch (err: any) {
      setError(err?.message || 'A operação falhou com segurança.')
    } finally {
      setBusy('')
    }
  }

  const generate = async () => {
    if (!accessToken) return
    await run('generate', () =>
      generateCourseStudioDraft(
        {
          organization_slug: orgslug,
          topic,
          audience,
          module_count: moduleCount,
        },
        accessToken
      )
    )
  }

  const saveEdit = async () => {
    if (!selected || !accessToken) return
    const nextDraft = {
      ...selected.draft,
      title: editTitle.trim(),
      description: editDescription.trim(),
    }
    await run('edit', () =>
      editCourseStudioDraft(selected.draft_id, selected.revision, nextDraft, accessToken)
    )
  }

  const publish = async () => {
    if (!selected || !accessToken) return
    setBusy('publish')
    setError('')
    try {
      const result = await publishCourseStudioDraft(selected.draft_id, selected.revision, accessToken)
      replaceDraft(result.draft)
    } catch (err: any) {
      setError(err?.message || 'A publicação falhou com segurança.')
    } finally {
      setBusy('')
    }
  }

  const blockers = selected?.review?.notes?.filter((note: any) => note.severity === 'BLOCKER') || []
  const editChanged = Boolean(
    selected &&
      (editTitle.trim() !== selected.draft.title || editDescription.trim() !== selected.draft.description)
  )

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8">
      <header className="mb-8 space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600">XPeX AI Course Studio</span>
        <h1 className="text-3xl font-bold text-slate-950">IA editorial com aprovação humana e publicação nativa</h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          OpenRouter gera, Hugging Face revisa e o LearnHouse só recebe o conteúdo após duas ações humanas distintas: Aprovar e Publicar.
        </p>
      </header>

      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold">Novo rascunho</h2>
            <label className="mb-3 block text-sm font-medium text-slate-700">
              Tema
              <input value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
            </label>
            <label className="mb-3 block text-sm font-medium text-slate-700">
              Público
              <textarea value={audience} onChange={(e) => setAudience(e.target.value)} rows={3} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
            </label>
            <label className="mb-4 block text-sm font-medium text-slate-700">
              Módulos
              <input type="number" min={1} max={12} value={moduleCount} onChange={(e) => setModuleCount(Math.min(12, Math.max(1, Number(e.target.value))))} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
            </label>
            <button onClick={generate} disabled={!accessToken || busy !== ''} className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {busy === 'generate' ? 'Gerando…' : 'Gerar com IA'}
            </button>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Rascunhos</h2>
              <button onClick={() => void load()} className="text-xs font-medium text-slate-500 hover:text-slate-900">Atualizar</button>
            </div>
            <div className="space-y-2">
              {drafts.length === 0 && <p className="text-sm text-slate-500">Nenhum rascunho editorial ainda.</p>}
              {drafts.map((draft) => (
                <button key={draft.draft_id} onClick={() => setSelectedId(draft.draft_id)} className={`w-full rounded-xl border p-3 text-left ${selected?.draft_id === draft.draft_id ? 'border-slate-950 bg-slate-50' : 'border-slate-200'}`}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{draft.draft.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeClass[draft.status] || 'bg-slate-100 text-slate-700'}`}>{draft.status}</span>
                  </div>
                  <p className="text-xs text-slate-500">rev. {draft.revision} · {draft.module_count} módulo(s)</p>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {!selected ? (
            <div className="flex min-h-[420px] items-center justify-center text-sm text-slate-500">Gere um rascunho para começar.</div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badgeClass[selected.status] || 'bg-slate-100'}`}>{selected.status}</span>
                    <span className="text-xs text-slate-400">rev. {selected.revision} · hash {selected.content_hash.slice(0, 10)}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-950">{selected.draft.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{selected.draft.description}</p>
                </div>
                {selected.status === 'PUBLISHED' && selected.native_course_uuid && (
                  <Link href={`/orgs/${orgslug}/course/${selected.native_course_uuid}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Abrir curso nativo</Link>
                )}
              </div>

              {selected.status !== 'PUBLISHED' && (
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Edição editorial</h3>
                      <p className="text-xs text-slate-500">Salvar uma alteração cria nova revisão e invalida revisão/aprovação anteriores.</p>
                    </div>
                    <button onClick={saveEdit} disabled={!editChanged || busy !== '' || editTitle.trim().length < 3 || editDescription.trim().length < 40} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-40">
                      {busy === 'edit' ? 'Salvando…' : 'Salvar edição'}
                    </button>
                  </div>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold" aria-label="Título do curso" />
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" aria-label="Descrição do curso" />
                </section>
              )}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <button disabled={busy !== '' || selected.status === 'PUBLISHED' || editChanged} onClick={() => accessToken && run('review', () => reviewCourseStudioDraft(selected.draft_id, selected.revision, accessToken))} className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 disabled:opacity-40">
                  {busy === 'review' ? 'Revisando…' : '1. Revisar'}
                </button>
                <button disabled={busy !== '' || selected.status !== 'REVIEWED' || blockers.length > 0 || editChanged} onClick={() => accessToken && run('approve', () => approveCourseStudioDraft(selected.draft_id, selected.revision, accessToken))} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 disabled:opacity-40">
                  {busy === 'approve' ? 'Aprovando…' : '2. Aprovar'}
                </button>
                <button disabled={busy !== '' || selected.status !== 'APPROVED' || editChanged} onClick={publish} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">
                  {busy === 'publish' ? 'Publicando…' : '3. Publicar'}
                </button>
                <div className="rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-500">
                  <div>OpenRouter: {selected.generated_by || 'server-side'}</div>
                  <div>Review: {selected.reviewed_by || 'pendente'}</div>
                </div>
              </div>

              {selected.review && (
                <section>
                  <h3 className="mb-3 font-semibold">Revisão independente</h3>
                  <div className="space-y-2">
                    {selected.review.notes.length === 0 && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Nenhuma observação registrada.</p>}
                    {selected.review.notes.map((note: any, index: number) => (
                      <div key={`${note.area}-${index}`} className={`rounded-lg border p-3 text-sm ${note.severity === 'BLOCKER' ? 'border-red-200 bg-red-50 text-red-800' : note.severity === 'WARNING' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                        <span className="mr-2 font-bold">{note.severity}</span><span className="font-semibold">{note.area}:</span> {note.note}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="mb-3 font-semibold">Estrutura do curso</h3>
                <div className="space-y-4">
                  {selected.draft.modules.map((module: any, moduleIndex: number) => (
                    <div key={`${module.title}-${moduleIndex}`} className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Módulo {moduleIndex + 1}</div>
                      <h4 className="font-semibold text-slate-900">{module.title}</h4>
                      <p className="mt-1 text-sm text-slate-600">{module.outcome}</p>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {module.lessons.map((lesson: any, lessonIndex: number) => (
                          <div key={`${lesson.title}-${lessonIndex}`} className="rounded-lg bg-slate-50 p-3">
                            <div className="text-sm font-semibold">{lesson.title}</div>
                            <p className="mt-1 text-xs leading-5 text-slate-600">{lesson.objective}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
                Segurança editorial: Gerar, Revisar, Editar e Aprovar não criam curso nativo. Somente Publicar cruza a fronteira editorial, com autorização, revisão e hash revalidados no servidor.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
