'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { askPulseXara } from '@services/pulse/pulse'
import type { PulseXaraItem, PulseXaraMessage } from '@/types/pulse'

interface PulseXaraBlockProps {
  items: PulseXaraItem[]
  label?: string
  accessToken: string
  organizationSlug: string
  activeVideoTitle?: string
  initialPrompt?: string
}

export function PulseXaraBlock({
  items,
  label = 'Disponível',
  accessToken,
  organizationSlug,
  activeVideoTitle,
  initialPrompt,
}: PulseXaraBlockProps) {
  const [messages, setMessages] = useState<PulseXaraMessage[]>([
    {
      id: 'init-msg',
      role: 'xara',
      content:
        'Olá! Sou a XARA, sua mentora de IA na XPeX Academy. Estou pronta para transformar as descobertas do Pulse em conhecimento prático. O que gostaria de analisar agora?',
      timestamp: 'Agora',
      actionSuggestions: [
        'Resumir este conteúdo',
        'Criar trilha personalizada',
        'Sugerir próximos vídeos',
      ],
      linkedUrl: '/xpex/trails',
    },
  ])
  const [inputValue, setInputValue] = useState(initialPrompt || '')
  const [loading, setLoading] = useState(false)

  const handleSend = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setInputValue('')
    setLoading(true)

    setMessages((prev) => [
      ...prev,
      {
        id: `user-msg-${prev.length + 1}`,
        role: 'user',
        content: trimmed,
        timestamp: 'Agora',
      },
    ])

    try {
      const reply = await askPulseXara(trimmed, activeVideoTitle, accessToken, organizationSlug)
      setMessages((prev) => [...prev, reply])

      // Telemetry
      import('@/lib/firebase')
        .then(({ trackXpexEvent }) => {
          trackXpexEvent('pulse_xara_action', { prompt_length: trimmed.length })
        })
        .catch(() => {})
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend(inputValue)
    }
  }

  return (
    <section className="pulse-xara-panel" id="pulse-xara-panel" aria-label="Aprenda com XARA">
      <div className="pulse-panel-header">
        <div className="pulse-panel-title-wrap">
          <span className="pulse-panel-accent-tag">COPILOT PEDAGÓGICO</span>
          <h3 className="pulse-panel-title">APRENDA COM XARA</h3>
        </div>
        <div className="pulse-xara-status-pills">
          <span className="pulse-badge-gxeon">GXEON ENGINE</span>
          <span className="pulse-label-badge">{label}</span>
        </div>
      </div>

      <div className="pulse-xara-content-box">
        <div className="pulse-xara-messages-log" role="log" aria-live="polite">
          {messages.map((msg) => (
            <div key={msg.id} className={`pulse-xara-bubble-row is-${msg.role}`}>
              {msg.role === 'xara' && (
                <div className="pulse-xara-avatar" aria-hidden="true">
                  <span>X</span>
                </div>
              )}
              <div className="pulse-xara-bubble">
                <p className="pulse-xara-text">{msg.content}</p>

                {msg.actionSuggestions && msg.actionSuggestions.length > 0 && (
                  <div className="pulse-xara-suggestions">
                    {msg.actionSuggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        className="pulse-xara-chip"
                        onClick={() => handleSend(sug)}
                        disabled={loading}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}

                {msg.linkedUrl && (
                  <div className="pulse-xara-link-row">
                    <Link href={msg.linkedUrl} className="pulse-xara-direct-link">
                      Acessar trilhas conectadas →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="pulse-xara-bubble-row is-xara">
              <div className="pulse-xara-avatar" aria-hidden="true">
                <span>X</span>
              </div>
              <div className="pulse-xara-bubble is-loading">
                <span className="pulse-typing-indicator">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="pulse-typing-label">XARA está analisando o contexto...</span>
              </div>
            </div>
          )}
        </div>

        <div className="pulse-xara-input-row">
          <label htmlFor="pulse-xara-input" className="sr-only">
            Pergunte algo para XARA
          </label>
          <input
            id="pulse-xara-input"
            type="text"
            className="pulse-xara-input-field"
            placeholder="Pergunte algo para XARA (ex: 'Como aplico este conceito em um projeto?')..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            type="button"
            className="pulse-xara-send-btn"
            onClick={() => handleSend(inputValue)}
            disabled={!inputValue.trim() || loading}
            aria-label="Enviar mensagem para XARA"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        {items && items.length > 0 && (
          <div className="pulse-xara-recommended-strip">
            <span className="pulse-strip-label">Sugestões de estudo:</span>
            <div className="pulse-strip-items">
              {items.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  className="pulse-strip-chip"
                  onClick={() => handleSend(it.suggestedPrompt || `Quero saber mais sobre ${it.title}`)}
                >
                  {it.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
