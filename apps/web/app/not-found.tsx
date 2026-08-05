import { ArrowLeft, Compass, Home } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#02050B] px-5 py-10 text-slate-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(255,106,0,0.20),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(8,124,255,0.20),transparent_28%),linear-gradient(145deg,#02050B_0%,#050D18_58%,#02050B_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
      </div>

      <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-[#081321]/88 p-8 text-center shadow-2xl backdrop-blur-xl md:p-14">
          <Link href="/" className="mx-auto inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9FF]">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#FF6A00] to-[#FF8A2A] text-lg font-black text-white shadow-[0_0_32px_rgba(255,106,0,.28)]">XP</span>
            <span className="text-left">
              <strong className="block tracking-[.2em] text-white">XpeX</strong>
              <small className="text-[10px] font-bold uppercase tracking-[.24em] text-slate-500">Academy</small>
            </span>
          </Link>

          <div className="mx-auto mt-12 grid h-20 w-20 place-items-center rounded-3xl border border-[#16D9FF]/20 bg-[#16D9FF]/10 text-[#16D9FF]">
            <Compass size={34} aria-hidden="true" />
          </div>

          <p className="mt-8 text-sm font-black uppercase tracking-[.28em] text-[#FF8A2A]">Erro 404</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-6xl">Esta rota saiu da trilha.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-400 md:text-lg">
            A página pode ter mudado de endereço, ainda não fazer parte desta versão Beta ou nunca ter existido.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6A00] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#FF8A2A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9FF]">
              <Home size={17} aria-hidden="true" /> Voltar à página inicial
            </Link>
            <Link href="/beta/aluno" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#16D9FF]/25 bg-[#16D9FF]/10 px-6 py-3.5 text-sm font-bold text-[#16D9FF] transition hover:bg-[#16D9FF]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9FF]">
              <ArrowLeft size={17} aria-hidden="true" /> Explorar a experiência Beta
            </Link>
          </div>

          <p className="mt-10 text-xs text-slate-600">XpeX Academy • Ambiente Beta em evolução</p>
        </div>
      </section>
    </main>
  )
}
