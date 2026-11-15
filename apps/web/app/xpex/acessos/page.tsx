import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const destinations = [
  { title: 'Painel oficial do Polo', detail: 'Gestão de turmas, cursos e professores; requer papel autorizado.', href: '/xpex/polo' },
  { title: 'Administração Academy', detail: 'Controle administrativo com autorização específica.', href: '/xpex/admin' },
  { title: 'Laboratório de I.A. GX', detail: 'Projetos, atividades e copiloto para estudantes matriculados.', href: '/xpex/ai-lab' },
  { title: 'Atividades e aulas', detail: 'Acesso às atividades publicadas e ao progresso autorizado.', href: '/xpex/activities' },
  { title: 'XPeX Pulse', detail: 'Radar e observabilidade do ecossistema.', href: '/xpex/pulse' },
] as const

export default function AcademyAccessPortal() {
  return (
    <main className="min-h-screen bg-[#070e1b] px-5 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold tracking-widest text-sky-300">XPeX Academy Everywhere</p>
        <h1 className="mt-3 text-3xl font-bold md:text-5xl">Central de acesso à escola</h1>
        <p className="mt-4 max-w-3xl text-slate-300">Acesse os ambientes acadêmicos reais. Esta central não concede permissões, cria matrículas ou simula progresso: cada módulo exige autenticação e autorização no backend.</p>
        <div className="mt-6 rounded-xl border border-white/15 bg-white/5 p-4" role="status">
          <strong>Ambientes oficiais e demonstrações</strong>
          <p className="mt-1 text-sm text-slate-300">A central é pública. Para os ambientes oficiais, entre com uma conta autorizada. As experiências Beta são demonstrações, não matrículas reais.</p>
          <Link className="mt-3 inline-block rounded-lg bg-sky-500 px-4 py-2 font-semibold text-slate-950" href="/login?next=%2Fxpex%2Facessos">Entrar na Academy</Link>
        </div>
        <section className="mt-8 grid gap-4 md:grid-cols-2" aria-label="Ambientes da Academy">
          {destinations.map(item => (
            <article key={item.href} className="rounded-2xl border border-white/15 bg-white/5 p-6">
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="mt-2 min-h-12 text-sm text-slate-300">{item.detail}</p>
              <Link className="mt-4 inline-block rounded-lg border border-sky-400/60 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-400/10" href={item.href}>Abrir ambiente →</Link>
            </article>
          ))}
        </section>
        <section className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-6" aria-label="Experiências de demonstração"><h2 className="text-xl font-semibold">Conheça os ambientes — demonstração</h2><p className="mt-2 text-sm text-slate-300">Painéis Beta sem acesso a matrículas ou dados acadêmicos reais.</p><div className="mt-4 flex flex-wrap gap-3"><Link className="rounded-lg border border-sky-400/60 px-4 py-2 text-sky-200" href="/beta/aluno">Aluno Beta</Link><Link className="rounded-lg border border-sky-400/60 px-4 py-2 text-sky-200" href="/beta/professora">Professora Beta</Link><Link className="rounded-lg border border-sky-400/60 px-4 py-2 text-sky-200" href="/beta/polo">Polo Beta</Link></div></section>
        <p className="mt-8 text-sm text-amber-200">Disponibilidade: links apontam para rotas reais do repositório; a operação de cada módulo depende da API acadêmica, banco de dados e permissões ainda em validação.</p>
      </div>
    </main>
  )
}
