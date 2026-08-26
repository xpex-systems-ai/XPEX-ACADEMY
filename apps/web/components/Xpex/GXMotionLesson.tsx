'use client'

import { useEffect, useMemo, useState } from 'react'
import type { XpexModuleGuide } from '@/lib/xpex/module-guides'

type Scene = {
  kicker: string
  title: string
  body: string
}

function splitExplanation(text: string) {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(item => item.trim()).filter(Boolean) ?? [text]
  const midpoint = Math.max(1, Math.ceil(sentences.length / 2))
  return [sentences.slice(0, midpoint).join(' '), sentences.slice(midpoint).join(' ') || sentences.slice(0, midpoint).join(' ')]
}

function buildScenes(guide: XpexModuleGuide): Scene[] {
  const [concept, application] = splitExplanation(guide.explanation)
  return [
    { kicker: `Módulo ${guide.module} · Abertura`, title: guide.title, body: guide.objective },
    { kicker: 'Conceito central', title: 'Entenda antes de aplicar', body: concept },
    { kicker: 'Aplicação profissional', title: 'Transforme conceito em decisão', body: application },
    { kicker: 'Laboratório', title: 'Agora pratique', body: guide.practice },
    {
      kicker: 'Fechamento GX',
      title: 'Aprenda → pratique → construa → comprove',
      body: `Você concluiu a aula audiovisual do módulo ${guide.module}. Revise o conteúdo LearnHouse, execute a prática orientada e registre uma evidência real antes de avançar.`,
    },
  ]
}

export function GXMotionLesson({ guide }: { guide: XpexModuleGuide }) {
  const scenes = useMemo(() => buildScenes(guide), [guide])
  const [sceneIndex, setSceneIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [supported, setSupported] = useState(false)
  const [rate, setRate] = useState(1)
  const scene = scenes[sceneIndex]

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])

  const speakScene = (index: number) => {
    if (!supported) return
    window.speechSynthesis.cancel()
    const target = scenes[index]
    const utterance = new SpeechSynthesisUtterance(`${target.title}. ${target.body}`)
    utterance.lang = 'pt-BR'
    utterance.rate = rate
    utterance.pitch = 1
    utterance.onend = () => {
      if (index < scenes.length - 1) {
        const nextIndex = index + 1
        setSceneIndex(nextIndex)
        window.setTimeout(() => speakScene(nextIndex), 350)
      } else {
        setPlaying(false)
      }
    }
    utterance.onerror = () => setPlaying(false)
    setSceneIndex(index)
    setPlaying(true)
    window.speechSynthesis.speak(utterance)
  }

  const togglePlay = () => {
    if (!supported) return
    if (playing) {
      window.speechSynthesis.cancel()
      setPlaying(false)
      return
    }
    speakScene(sceneIndex)
  }

  const jump = (index: number) => {
    if (playing && supported) window.speechSynthesis.cancel()
    setPlaying(false)
    setSceneIndex(index)
  }

  const progress = ((sceneIndex + 1) / scenes.length) * 100

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-orange-400/20 bg-[#02070f] shadow-[0_24px_80px_rgba(0,0,0,.42)]" aria-labelledby="gx-motion-title">
      <div className="relative aspect-video min-h-[360px] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(0,182,255,.24),transparent_32%),radial-gradient(circle_at_15%_70%,rgba(255,112,0,.22),transparent_34%),linear-gradient(135deg,#030811,#07111d_55%,#02060c)]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(0,208,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,112,0,.06)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="absolute -right-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full border border-cyan-300/20 shadow-[0_0_80px_rgba(0,208,255,.16)] motion-safe:animate-pulse" />
        <div className="absolute -right-8 top-1/2 h-52 w-52 -translate-y-1/2 rotate-45 border border-orange-300/25 shadow-[0_0_60px_rgba(255,112,0,.12)]" />

        <div className="relative z-10 flex h-full min-h-[360px] flex-col justify-between p-6 sm:p-8 lg:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">GX Motion Lesson · Audiovisual interativa</p>
              <p className="mt-1 text-xs text-slate-500">XPeX Academy · baseada no conteúdo oficial LearnHouse</p>
            </div>
            <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold text-slate-300">Cena {sceneIndex + 1}/{scenes.length}</div>
          </div>

          <div className="max-w-3xl py-8">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-300">{scene.kicker}</p>
            <h2 id="gx-motion-title" key={`title-${sceneIndex}`} className="mt-4 max-w-2xl text-3xl font-black leading-tight text-white sm:text-4xl motion-safe:animate-[fadeIn_.45s_ease-out]">{scene.title}</h2>
            <p key={`body-${sceneIndex}`} className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg motion-safe:animate-[fadeIn_.6s_ease-out]">{scene.body}</p>
          </div>

          <div>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-cyan-300 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={togglePlay} disabled={!supported} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-950/30 disabled:opacity-40">
                {playing ? '❚❚ Pausar aula' : '▶ Assistir aula'}
              </button>
              <button type="button" onClick={() => jump(Math.max(0, sceneIndex - 1))} disabled={sceneIndex === 0} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-slate-200 disabled:opacity-30">← Cena</button>
              <button type="button" onClick={() => jump(Math.min(scenes.length - 1, sceneIndex + 1))} disabled={sceneIndex === scenes.length - 1} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-slate-200 disabled:opacity-30">Próxima →</button>
              <label className="ml-auto flex items-center gap-2 text-xs font-bold text-slate-400">
                Velocidade
                <select value={rate} onChange={event => setRate(Number(event.target.value))} className="rounded-lg border border-white/10 bg-[#07111d] px-2 py-2 text-slate-200">
                  <option value={0.85}>0,85x</option>
                  <option value={1}>1x</option>
                  <option value={1.15}>1,15x</option>
                  <option value={1.3}>1,3x</option>
                </select>
              </label>
            </div>
            {!supported ? <p className="mt-3 text-xs text-amber-300">Seu navegador não oferece síntese de voz. As cenas e legendas continuam disponíveis normalmente.</p> : null}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 bg-black/20 px-6 py-4 sm:px-8">
        <p className="text-xs leading-5 text-slate-500">Formato audiovisual gerado e narrado no navegador: animações, cenas, legendas e voz. Não é apresentado como vídeo gravado por uma pessoa ou avatar. Quando uma mídia oficial hospedada/YouTube existir, o player LearnHouse continua sendo a fonte principal.</p>
      </div>
    </section>
  )
}
