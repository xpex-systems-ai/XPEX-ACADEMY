'use client'

import { useEffect, useMemo, useState } from 'react'
import type { XpexModuleGuide } from '@/lib/xpex/module-guides'

export function GXModuleGuide({ guide }: { guide: XpexModuleGuide }) {
  const [speaking, setSpeaking] = useState(false)
  const [supported, setSupported] = useState(false)
  const narration = useMemo(
    () => `${guide.title}. Objetivo: ${guide.objective} ${guide.explanation} Prática: ${guide.practice}`,
    [guide],
  )

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])

  const play = () => {
    if (!supported) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(narration)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.96
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  const stop = () => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(3,10,19,.96),rgba(7,18,29,.92))]" aria-labelledby="gx-module-guide-title">
      <div className="grid gap-0 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="relative flex min-h-64 flex-col justify-between overflow-hidden border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(0,208,255,.22),transparent_34%),radial-gradient(circle_at_90%_90%,rgba(255,112,0,.16),transparent_34%)]" />
          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">GX Aula Guiada · Módulo {guide.module}</p>
            <h2 id="gx-module-guide-title" className="mt-3 text-2xl font-black text-white">{guide.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{guide.objective}</p>
          </div>
          <div className="relative z-10 mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={speaking ? stop : play} disabled={!supported} className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">
              {speaking ? 'Pausar explicação' : '▶ Ouvir explicação GX'}
            </button>
            {speaking ? <button type="button" onClick={play} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white">Reiniciar</button> : null}
          </div>
          {!supported ? <p className="relative z-10 mt-3 text-xs text-slate-500">Narração por voz não é suportada neste navegador; o roteiro completo permanece disponível ao lado.</p> : null}
        </div>
        <div className="p-6 lg:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Explicação do módulo</p>
          <p className="mt-3 text-base leading-7 text-slate-200">{guide.explanation}</p>
          <div className="mt-5 rounded-2xl border border-orange-300/15 bg-orange-300/[0.05] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-200">Prática orientada</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{guide.practice}</p>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">Esta aula guiada usa o roteiro oficial do módulo. Ela complementa o conteúdo LearnHouse e não é apresentada como um vídeo gravado.</p>
        </div>
      </div>
    </section>
  )
}
