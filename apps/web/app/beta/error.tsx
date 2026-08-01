'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function BetaError({ reset }: { reset: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-[#020817] p-6 text-center text-slate-100"><div className="max-w-md"><AlertTriangle className="mx-auto text-yellow-300" size={42} /><h1 className="mt-5 text-3xl font-black">Não foi possível abrir o preview</h1><p className="mt-3 leading-7 text-slate-400">Tente novamente. Nenhum dado foi enviado ou alterado.</p><button onClick={reset} className="mt-6 inline-flex items-center gap-2 rounded-full bg-yellow-300 px-5 py-3 text-sm font-black text-slate-950"><RefreshCw size={16} /> Tentar novamente</button></div></main>
}
