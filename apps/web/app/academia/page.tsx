'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import {
  ArrowRight, BookOpen, BrainCircuit, CheckCircle2, ChevronRight, CircleAlert,
  ClipboardList, GraduationCap, LockKeyhole, LogOut, Menu, ShieldCheck,
  Sparkles, UserRound, UsersRound,
} from 'lucide-react'

type Course = { id: string; polo_id: string; title: string; slug: string; description: string }
type Lesson = { id: string; course_id: string; title: string; position: number; body: string }
type Enrollment = { id: string; course_id: string }
type Progress = { id: string; enrollment_id: string; lesson_id: string; completed_at: string }
type PilotData = {
  authenticated: boolean
  user: { id: string; email?: string }
  polos: { id: string; name: string; slug: string }[]
  invites: { email: string; role: string; polo_id: string }[]
  courses: Course[]
  enrollments: Enrollment[]
  lessons: Lesson[]
  progress: Progress[]
  legacyImported: false
}
type Section = 'inicio' | 'cursos' | 'polo' | 'laboratorio' | 'certificados' | 'conta'

const sectionNames: { id: Section; label: string; Icon: typeof BookOpen }[] = [
  { id: 'inicio', label: 'Visão Geral', Icon: GraduationCap },
  { id: 'cursos', label: 'Meus Cursos', Icon: BookOpen },
  { id: 'polo', label: 'Polo Kelle', Icon: UsersRound },
  { id: 'laboratorio', label: 'Laboratório GX', Icon: BrainCircuit },
  { id: 'certificados', label: 'Certificados', Icon: ShieldCheck },
  { id: 'conta', label: 'Minha Conta', Icon: UserRound },
]

export default function AcademiaPage() {
  const [data, setData] = useState<PilotData | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signup, setSignup] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'code' | 'password'>('code')
  const [loginCode, setLoginCode] = useState('')
  const [codeRequested, setCodeRequested] = useState(false)
  const [section, setSection] = useState<Section>('inicio')
  const [chosen, setChosen] = useState<string | null>(null)
  const [mobileMenu, setMobileMenu] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/academia', { cache: 'no-store', credentials: 'same-origin' })
      if (res.status === 401) { setData(null); setError(''); return }
      const body = await res.json()
      if (!res.ok) { setError(body.error || 'Não foi possível acessar o banco acadêmico.'); return }
      setData(body as PilotData)
      setError('')
    } catch { setError('Conexão indisponível. Verifique sua internet e tente novamente.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])
  const send = async (payload: Record<string, unknown>) => {
    setWorking(true); setError(''); setNotice('')
    try {
      const res = await fetch('/api/academia', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) { setError(body.error || 'Não foi possível concluir a operação.'); return false }
      if (body.message) setNotice(body.message)
      if (body.confirmationRequired) return false
      await load()
      return true
    } catch { setError('Falha de conexão. Nenhum resultado foi considerado concluído.'); return false }
    finally { setWorking(false) }
  }

  const onLogin = async (event: FormEvent) => {
    event.preventDefault()
    if (loginMethod === 'code') {
      const ok = await send(codeRequested
        ? { action: 'verify_code', email, code: loginCode }
        : { action: 'request_code', email })
      if (ok && !codeRequested) setCodeRequested(true)
      if (ok && codeRequested) { setLoginCode(''); setCodeRequested(false) }
      return
    }
    await send({ action: signup ? 'signup' : 'login', email, password })
    setPassword('')
  }
  const courses = data?.courses || []
  const enrollments = data?.enrollments || []
  const lessons = data?.lessons || []
  const progress = data?.progress || []
  const enrolledIds = new Set(enrollments.map(e => e.course_id))
  const selectedCourse = courses.find(c => c.id === chosen) || null
  const selectedEnrollment = enrollments.find(e => e.course_id === selectedCourse?.id)
  const selectedLessons = lessons.filter(l => l.course_id === selectedCourse?.id)
  const completed = selectedLessons.filter(l => progress.some(p => p.lesson_id === l.id && p.enrollment_id === selectedEnrollment?.id)).length
  const totalCompleted = progress.length
  const pilotRole = data?.invites[0]?.role
  const allowed = Boolean(pilotRole)
  const visit = (id: Section) => { setSection(id); setChosen(null); setMobileMenu(false); setError(''); setNotice('') }
  const nav = (
    <nav className="mt-8 space-y-1" aria-label="Ambientes da XPeX Academy">
      {sectionNames.map(({ id, label, Icon }) => (
        <button key={id} onClick={() => visit(id)} type="button"
          className={'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ' +
            (section === id ? 'bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/40' : 'text-slate-300 hover:bg-white/5 hover:text-white')}>
          <Icon size={19} /> {label}
        </button>
      ))}
    </nav>
  )
  return (
    <div className="min-h-screen bg-[#060C18] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(22,78,140,0.18),transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1536px]">
        {data && allowed && (
          <>
            <aside className="hidden min-h-screen w-64 shrink-0 border-r border-sky-900/40 bg-[#070E1C]/95 px-4 py-6 lg:block">
              <div className="px-3">
                <p className="text-3xl font-black tracking-tight"><span className="text-orange-400">X</span>PeX</p>
                <p className="text-xs font-semibold tracking-[0.34em] text-slate-400">ACADEMY AI</p>
                <p className="mt-5 text-xs font-bold uppercase tracking-widest text-sky-300">Kelle Digital Lab</p>
              </div>
              {nav}
              <div className="mt-12 rounded-xl border border-sky-500/30 bg-sky-950/30 p-3 text-xs leading-relaxed text-slate-300">
                <ShieldCheck className="mb-2 text-sky-300" size={20}/>
                <strong>Ambiente acadêmico protegido</strong>
                <p className="mt-2">Matrículas e progresso reais no Supabase. Dados da Railway antiga ainda não foram importados.</p>
              </div>
            </aside>
            {mobileMenu && (
              <div className="fixed inset-0 z-30 bg-black/80 p-4 lg:hidden">
                <div className="max-w-sm rounded-xl border border-sky-700/50 bg-[#0A1427] p-4">
                  <button className="mb-4 text-sm text-orange-300" onClick={() => setMobileMenu(false)}>Fechar menu</button>
                  {nav}
                </div>
              </div>
            )}
          </>
        )}
        <main className="w-full min-w-0 flex-1 px-4 pb-16 pt-5 md:px-8">
          <header className="flex items-center justify-between gap-3 border-b border-sky-900/40 pb-5">
            <div className="flex items-center gap-3">
              {data && allowed && <button aria-label="Abrir menu" className="rounded-lg border border-slate-700 p-2 lg:hidden" onClick={() => setMobileMenu(true)}><Menu size={20}/></button>}
              <div>
                <p className="text-sm font-black tracking-wider text-orange-400">XPeX ACADEMY</p>
                <p className="text-xs text-slate-400">Learning Operating System • Polo Kelle</p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-500/30 px-3 py-1 text-[11px] font-medium text-emerald-300">Supabase • ambiente restrito</span>
          </header>

          {loading && <div className="py-20 text-center text-slate-400">Verificando a sessão e os dados acadêmicos...</div>}

          {!loading && !data && (
            <section className="mx-auto mt-10 max-w-lg rounded-3xl border border-sky-700/40 bg-[#0C1930] p-6 shadow-2xl md:p-10">
              <div className="mb-7 inline-flex rounded-2xl border border-orange-500/40 bg-orange-500/10 p-4 text-orange-300"><GraduationCap size={32}/></div>
              <h1 className="text-3xl font-black">Bem-vindo à XPeX Academy</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">Entre para acessar o primeiro ambiente acadêmico com matrícula e progresso salvos no banco real. Nesta etapa, somente contas autorizadas para o Polo Kelle conseguem ver os cursos.</p>
              <div className="mt-8 flex gap-2" role="group" aria-label="Método de acesso">
                <button type="button" onClick={()=>{setLoginMethod('code');setCodeRequested(false);setError('');setNotice('')}} className={'rounded-xl px-4 py-3 text-sm font-semibold ' + (loginMethod==='code'?'bg-orange-500 text-white':'border border-slate-700 text-slate-300')}>Entrar sem senha</button>
                <button type="button" onClick={()=>{setLoginMethod('password');setError('');setNotice('')}} className={'rounded-xl px-4 py-3 text-sm font-semibold ' + (loginMethod==='password'?'bg-orange-500 text-white':'border border-slate-700 text-slate-300')}>Senha existente</button>
              </div>
              <form onSubmit={onLogin} className="mt-5 space-y-4">
                <label className="block text-sm text-slate-300">E-mail
                  <input type="email" autoComplete="email" required value={email} onChange={e=>{setEmail(e.target.value);setCodeRequested(false);setLoginCode('')}} placeholder="seu@email.com"
                    className="mt-2 w-full rounded-xl border border-sky-700/50 bg-[#050B18] px-4 py-3 text-white outline-none focus:border-orange-400"/>
                </label>
                {loginMethod === 'password' ? (
                  <label className="block text-sm text-slate-300">Senha
                    <input type="password" autoComplete={signup?'new-password':'current-password'} required minLength={10} value={password} onChange={e=>setPassword(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-sky-700/50 bg-[#050B18] px-4 py-3 text-white outline-none focus:border-orange-400"/>
                  </label>
                ) : codeRequested ? (
                  <label className="block text-sm text-slate-300">Código de seis dígitos recebido no e-mail
                    <input type="text" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6} value={loginCode} onChange={e=>setLoginCode(e.target.value.replace(/\D/g,''))}
                      className="mt-2 w-full rounded-xl border border-sky-700/50 bg-[#050B18] px-4 py-3 text-white outline-none focus:border-orange-400"/>
                  </label>
                ) : <p className="text-sm text-slate-300">Não precisa criar senha. Enviaremos um código para a sua conta autorizada. O envio depende da configuração de e-mail do Supabase.</p>}
                <button disabled={working} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-400 disabled:opacity-50">
                  {working?'Aguarde...':loginMethod==='code'?(codeRequested?'Confirmar código':'Solicitar código de acesso'):(signup?'Criar conta de teste':'Entrar na Academy')} <ArrowRight size={18}/>
                </button>
              </form>
              {loginMethod==='password' && (
                <button type="button" onClick={()=>{setSignup(!signup);setError('');setNotice('')}} className="mt-5 text-sm text-sky-300 hover:underline">
                  {signup?'Já tenho uma conta — entrar':'Primeiro acesso — cadastrar conta autorizada'}
                </button>
              )}
              {loginMethod==='code' && codeRequested && (
                <p className="mt-4 text-sm text-sky-300">Confira a caixa de entrada e o spam. Se recebeu um link em vez do código, o modelo de e-mail OTP do Supabase ainda precisa ser configurado. Evite solicitar vários códigos seguidos.</p>
              )}
              <p className="mt-6 text-xs leading-relaxed text-slate-400">Acesso do piloto via Supabase Auth, restrito a contas autorizadas. O login oficial com ChatGPT depende da habilitação da XPeX como parceiro da OpenAI. Não substitui automaticamente o LearnHouse anterior. Nenhum pagamento é realizado.</p>
            </section>
          )}

          {!loading && data && !allowed && (
            <section className="mx-auto mt-12 max-w-lg rounded-2xl border border-amber-500/30 bg-[#0C1930] p-6">
              <LockKeyhole className="mb-4 text-amber-300" size={32}/>
              <h1 className="text-2xl font-bold">Conta autenticada, aguardando convite</h1>
              <p className="mt-3 text-slate-300">Seu login foi confirmado, mas este e-mail ainda não está autorizado para o Polo Kelle. Não concedemos acesso por padrão.</p>
              <p className="mt-3 text-sm text-slate-400">{data.user.email}</p>
              <button onClick={()=>void send({action:'logout'})} disabled={working} className="mt-6 rounded-xl border border-slate-600 px-4 py-3">Sair da conta</button>
            </section>
          )}

          {!loading && data && allowed && (
            <div className="mt-7 space-y-6">
              <div className="rounded-3xl border border-sky-700/40 bg-[linear-gradient(125deg,#0E2742,#0A1426_65%,#2B160E)] p-6 md:p-9">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Polo educacional • Kelle Digital Lab</p>
                <h1 className="mt-3 text-3xl font-black md:text-5xl">{section === 'inicio' ? 'Aprender. Criar. Evoluir.' : sectionNames.find(s=>s.id===section)?.label}</h1>
                <p className="mt-4 max-w-xl leading-relaxed text-slate-300">Sua escola com IA, agora com autenticação e registros acadêmicos no Supabase. Esta é uma nova base controlada, sem importar dados antigos da Railway.</p>
                {section === 'inicio' && <button onClick={()=>visit('cursos')} className="mt-6 flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white">Abrir meus cursos <ChevronRight size={18}/></button>}
              </div>

              {(section === 'inicio' || section === 'cursos') && (
                <>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {[{ label:'Cursos disponíveis',value:courses.length, Icon:BookOpen },
                    {label:'Matrículas registradas',value:enrollments.length,Icon:GraduationCap},
                    {label:'Aulas concluídas',value:totalCompleted,Icon:CheckCircle2}].map(({label,value,Icon})=>(
                      <div key={label} className="rounded-2xl border border-sky-900/60 bg-[#0B172B] p-5">
                        <Icon className="text-sky-400" size={22}/><p className="mt-4 text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-slate-400">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-sky-900/60 bg-[#0B172B] p-5 md:p-7">
                    <h2 className="text-xl font-bold">Cursos do Polo Kelle</h2>
                    <p className="mb-5 mt-1 text-sm text-slate-400">Conteúdo original de validação, com matrícula gravada no banco.</p>
                    {courses.length===0 && <p className="text-sm text-slate-400">Nenhum curso foi liberado para esta conta.</p>}
                    <div className="grid gap-4 xl:grid-cols-2">
                      {courses.map(c=>(
                        <div key={c.id} className="rounded-xl border border-sky-800/50 bg-[#071020] p-5">
                          <p className="text-xs uppercase tracking-widest text-orange-300">XPeX • Kelle Digital Lab</p>
                          <h3 className="mt-3 text-lg font-bold">{c.title}</h3>
                          <p className="mt-2 min-h-12 text-sm leading-relaxed text-slate-400">{c.description}</p>
                          <button type="button" disabled={working}
                            onClick={async()=>{setChosen(c.id);if(!enrolledIds.has(c.id)){const ok=await send({action:'enroll',courseId:c.id});if(ok) setChosen(c.id)}}}
                            className="mt-4 flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-bold text-white disabled:opacity-50">
                            {working?'Salvando...':enrolledIds.has(c.id)?'Abrir aulas':'Matricular-se'} <ArrowRight size={17}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedCourse && enrolledIds.has(selectedCourse.id) && (
                    <section className="rounded-2xl border border-sky-700/50 bg-[#0B172B] p-5 md:p-7" aria-label="Aulas do curso">
                      <p className="text-xs font-bold uppercase tracking-widest text-sky-300">Sua sala de aula</p>
                      <h2 className="mt-2 text-xl font-bold">{selectedCourse.title}</h2>
                      <p className="mt-2 text-sm text-slate-400">Progresso: {completed}/{selectedLessons.length} aulas concluídas — registro persistente no banco.</p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-orange-500" style={{width: selectedLessons.length ? (completed/selectedLessons.length*100)+'%' : '0%'}}/></div>
                      <div className="mt-5 space-y-4">
                        {selectedLessons.map(lesson=>{
                          const done=progress.some(p=>p.lesson_id===lesson.id && p.enrollment_id===selectedEnrollment?.id)
                          return <article key={lesson.id} className="rounded-xl border border-sky-900/60 bg-[#070F1F] p-5">
                            <p className="text-xs text-sky-300">Aula {lesson.position}</p>
                            <h3 className="mt-2 text-lg font-semibold">{lesson.title}</h3>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">{lesson.body}</p>
                            <button disabled={working || done || !selectedEnrollment} onClick={()=>void send({action:'complete',enrollmentId:selectedEnrollment?.id,lessonId:lesson.id})}
                              className="mt-5 flex items-center gap-2 rounded-lg border border-orange-500/70 px-4 py-2 text-sm font-bold text-orange-200 disabled:border-emerald-600/40 disabled:text-emerald-300">
                              {done?<><CheckCircle2 size={17}/> Concluída e salva</>:<><ClipboardList size={17}/> Marcar aula concluída</>}
                            </button>
                          </article>
                        })}
                        {selectedLessons.length===0 && <p className="text-sm text-slate-400">Ainda não há aulas liberadas para sua matrícula.</p>}
                      </div>
                    </section>
                  )}
                </>
              )}

              {section==='polo' && (
                <section className="rounded-2xl border border-sky-900/60 bg-[#0B172B] p-6">
                  <UsersRound className="text-orange-300" size={30}/>
                  <h2 className="mt-4 text-xl font-bold">{data.polos[0]?.name || 'Polo Kelle Digital Lab'}</h2>
                  <p className="mt-3 text-sm text-slate-300">Seu perfil autorizado neste ambiente: <strong>{pilotRole==='teacher'?'Professora':pilotRole==='admin'?'Administrador':'Aluno'}</strong>.</p>
                  <p className="mt-3 text-sm text-slate-400">As funções de convite de terceiros, emissão de certificados e administração de turmas antigas continuam bloqueadas até a integração completa do FastAPI e do banco histórico.</p>
                </section>
              )}
              {(section==='laboratorio' || section==='certificados') && (
                <section className="rounded-2xl border border-sky-900/60 bg-[#0B172B] p-6">
                  {section==='laboratorio'?<BrainCircuit className="text-sky-400" size={36}/>:<ShieldCheck className="text-sky-400" size={36}/>}
                  <h2 className="mt-4 text-xl font-bold">{section==='laboratorio'?'Laboratório GX':'Certificados verificáveis'}</h2>
                  <p className="mt-3 max-w-2xl leading-relaxed text-slate-300">Módulo existente no código da Academy anterior; integração com o FastAPI e permissões acadêmicas ainda em validação. Nenhum resultado, certificado ou conteúdo de IA é simulado nesta área.</p>
                </section>
              )}
              {section==='conta' && (
                <section className="rounded-2xl border border-sky-900/60 bg-[#0B172B] p-6">
                  <h2 className="text-xl font-bold">Identidade acadêmica</h2>
                  <p className="mt-3 text-sm text-slate-300">E-mail autenticado: {data.user.email}</p>
                  <p className="mt-2 text-sm text-slate-400">Papel do piloto: {pilotRole}. Identidade antiga do LearnHouse ainda não migrada.</p>
                  <button onClick={()=>void send({action:'logout'})} className="mt-5 flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2"><LogOut size={17}/> Sair com segurança</button>
                </section>
              )}
              <p className="rounded-xl border border-sky-900/50 bg-slate-900/30 px-5 py-3 text-xs text-slate-400">Ambiente de recuperação gratuito: novas contas e progresso reais no Supabase. Histórico anterior da Railway ainda não recuperado. Pagamentos desabilitados.</p>
            </div>
          )}
          {error && <div role="alert" className="mt-5 flex gap-2 rounded-xl border border-red-500/50 bg-red-950/40 p-4 text-sm text-red-200"><CircleAlert size={18}/>{error}</div>}
          {notice && <div role="status" className="mt-5 flex gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-sm text-emerald-200"><Sparkles size={18}/>{notice}</div>}
        </main>
      </div>
    </div>
  )
}
