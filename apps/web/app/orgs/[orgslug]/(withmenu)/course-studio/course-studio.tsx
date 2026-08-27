'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useLHSession } from '@components/Contexts/LHSessionContext'
import {
  approveCourseStudioDraft,
  CourseStudioDraft,
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
  const [selectedId, setSelectedId] = useState<string>('')
  const [busy, setBusy] = useState<string>('')
  const [error, setError] = useState<string>('')

  const selected = useMemo(
    () => drafts.find((draft) => draft.draft_id === selectedId) || drafts[0] || null,
    [drafts, selectedId]
  )

  const load = async () => {
    if (!accessToken) return
    try {
      const data = await listCourseStudioDrafts(orgslug, accessToken)
      setDrafts(data)
      if (!selectedId && data[0]) setSelectedId(data[0].draft_id)
      setError('')
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar o Course Studio.')
    }
  }

  useEffect(() => {
    void load()
  }, [accessToken, orgslug])

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

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8">
      <div className="mb-8 flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600">XPeX AI Course Studio</span>
        <h1 className="text-3xl font-bold text-slate-950">Gerar, revisar, aprovar e publicar com controle humano</h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          OpenRouter gera o rascunho, Hugging Face faz a revisão independente e o LearnHouse só recebe conteúdo após aprovação e publicação explícitas.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold">Novo rascunho</h2>
            <label className="mb-3 block text-sm font-medium text-slate-700">
              Tema
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
              />
            </label>
            <label className="mb-3 block text-sm font-medium text-slate-700">
              Público
              <textarea
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
              />
            </label>
            <label className="mb-4 block text-sm font-medium text-slate-700">
              Módulos
              <input
                type="number"
                min={1}
                max={12}
                value={moduleCount}
                onChange={(event) => setModuleCount(Math.min(12, Math.max(1, Number(event.target.value))))}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
              />
            </label>
            <button
              onClick={generate}
              disabled={!accessToken || busy !== ''}
              className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
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
                <button
                  key={draft.draft_id}
                  onClick={() => setSelectedId(draft.draft_id)}
                  className={`w-full rounded-xl border p-3 text-left ${selected?.draft_id === draft.draft_id ? 'border-slate-950 bg-slate-50' : 'border-slate-200'}`}
                >
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
                    <span className="text-xs text-slate-400">rev. {selected.revision}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-950">{selected.draft.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{selected.draft.description}</p>
                </div>
                {selected.status === 'PUBLISHED' && selected.native_course_uuid && (
                  <Link href={`/orgs/${orgslug}/course/${selected.native_course_uuid}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Abrir curso nativo
                  </Link>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <button
                  disabled={busy !== '' || selected.status === 'PUBLISHED'}
                  onClick={() => accessToken && run('review', () => reviewCourseStudioDraft(selected.draft_id, selected.revision, accessToken))}
                  className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 disabled:opacity-40"
                >
                  {busy === 'review' ? 'Revisando…' : '1. Revisar'}
                </button>
                <button
                  disabled={busy !== '' || selected.status !== 'REVIEWED' || blockers.length > 0}
                  onClick={() => accessToken && run('approve', () => approveCourseStudioDraft(selected.draft_id, selected.revision, accessToken))}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 disabled:opacity-40"
                >
                  {busy === 'approve' ? 'Aprovando…' : '2. Aprovar'}
                </button>
                <button
                  disabled={busy !== '' || selected.status !== 'APPROVED'}
                  onClick={publish}
                  className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {busy === 'publish' ? 'Publicando…' : '3. Publicar'}
                </button>
                <div className="rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-500">
                  <div>OpenRouter: {selected.generated_by || 'server-side'}</div>
                  <div>Review: {selected.reviewed_by || 'pendente'}</div>
                </div>
              </div>

              {selected.review && (
                <section>
                  <h3 className="mb-3 text-base font-semibold">Revisão independente</h3>
                  <div className="space-y-2">
                    {selected.review.notes.length === 0 && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Nenhuma observação registrada.</p>}
                    {selected.review.notes.map((note: any, index: number) => (
                      <div key={`${note.area}-${index}`} className={`rounded-lg border p-3 text-sm ${note.severity === 'BLOCKER' ? 'border-red-200 bg-red-50 text-red-800' : note.severity === 'WARNING' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                        <span className="mr-2 font-bold">{note.severity}</span>
                        <span className="font-semibold">{note.area}:</span> {note.note}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="mb-3 text-base font-semibold">Estrutura do curso</h3>
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
                Segurança editorial: gerar e revisar nunca criam curso no LearnHouse. Aprovar também não publica. A criação nativa ocorre somente no clique explícito em Publicar e é validada novamente no servidor.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
