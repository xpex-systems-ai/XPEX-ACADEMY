'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Paperclip,
  Send,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Settings,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { StreamSourceData, AIGatewayHealthResponse } from '@services/ai/ai'

export interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  sources?: StreamSourceData['sources']
  timestamp?: string
}

export interface GxeonChatShellProps {
  messages: ChatMessage[]
  onSendMessage: (_text: string) => Promise<void>
  isStreaming: boolean
  gatewayHealth: AIGatewayHealthResponse | null
  userInitials: string
  userName: string
}

export function GxeonChatShell({
  messages,
  onSendMessage,
  isStreaming,
  gatewayHealth,
  userInitials,
  userName,
}: GxeonChatShellProps) {
  const [inputText, setInputText] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed || isStreaming) return
    setInputText('')
    await onSendMessage(trimmed)
  }

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const toggleSources = (index: number) => {
    setExpandedSources((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  // The gateway health endpoint reports configuration readiness only.
  // It intentionally does not call the upstream provider, so avoid claiming
  // provider liveness from this snapshot.
  const isConfigured = gatewayHealth?.status === 'ready'
  const needsConfiguration = gatewayHealth?.status === 'unconfigured'

  const statusClass = isConfigured ? 'online' : needsConfiguration ? 'degraded' : 'offline'
  const statusLabel = isConfigured
    ? 'GX configurado'
    : needsConfiguration
    ? 'GX requer configuração'
    : 'GX temporariamente indisponível'

  // Keep provider branding intentionally narrow: only expose the public Gemini
  // label for confirmed Google aliases. All other providers remain behind the
  // provider-neutral GXEON AI identity.
  const provider = gatewayHealth?.provider?.toLowerCase()
  const providerBadge = provider === 'google' || provider === 'google-gla' || provider === 'gemini'
    ? 'Gemini'
    : 'GXEON AI'

  return (
    <section className="gxeon-chat-pane flex-1" aria-label="Área de conversação com o GXEON">
      {/* Chat Header */}
      <header className="gxeon-chat-header">
        <div className="gxeon-chat-header-left">
          <div className="gxeon-bot-avatar" aria-hidden="true">
            GX
          </div>
          <div>
            <div className="gxeon-chat-title-row">
              <span className="gxeon-chat-title">GXEON Copilot</span>
              <span className={`gxeon-status-indicator ${statusClass}`}>
                <span className="gxeon-status-dot" aria-hidden="true" />
                <span>{statusLabel}</span>
              </span>
            </div>
            <p className="gxeon-chat-subtitle">Seu assistente inteligente da XPeX Academy</p>
          </div>
        </div>

        <div className="gxeon-chat-header-actions">
          <span className="gxeon-badge-pill" title="Motor de inteligência configurado no servidor">
            {providerBadge}
          </span>
          <span className="gxeon-badge-pill">RAG Acadêmico</span>
          <span className="gxeon-badge-pill">Projetos GX</span>
          <button
            type="button"
            className="gxeon-action-icon-btn ml-1"
            aria-label="Configurações do workspace GXEON"
            title="Configurações do workspace GXEON"
          >
            <Settings size={17} />
          </button>
        </div>
      </header>

      {/* Messages Body */}
      <div className="gxeon-messages-body" tabIndex={0} aria-label="Histórico de mensagens">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 my-auto text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/25 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_24px_rgba(0,212,255,0.2)]">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Como posso te ajudar hoje, {userName}?</h3>
            <p className="text-xs text-slate-400 max-w-md mt-1 leading-5">
              Pergunte sobre seus cursos, conceitos de programação, arquitetura de software, ou como estruturar projetos usando IA e RAG na plataforma.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user'
          const time = msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

          if (isUser) {
            return (
              <div key={idx} className="gxeon-user-message-row">
                <div className="gxeon-user-bubble">
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <div className="gxeon-user-meta">
                  <div className="gxeon-user-avatar" title={userName}>
                    {userInitials}
                  </div>
                  <span className="gxeon-message-time">{time}</span>
                </div>
              </div>
            )
          }

          // Assistant message
          return (
            <div key={idx} className="gxeon-bot-message-row">
              <div className="gxeon-bot-avatar shrink-0 w-8 h-8 text-xs font-black" aria-hidden="true">
                GX
              </div>
              <div className="gxeon-bot-card">
                <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      ol: ({ children }) => <ol className="space-y-2.5 my-3 pl-0 list-none">{children}</ol>,
                      li: ({ children }) => {
                        return (
                          <li className="flex items-start gap-2 text-slate-200">
                            {children}
                          </li>
                        )
                      },
                      code: ({ children, ...props }) => (
                        <code className="bg-black/30 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Sources Drawer if RAG returned sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => toggleSources(idx)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                      <BookOpen size={14} />
                      <span>Fontes utilizadas ({msg.sources.length})</span>
                      {expandedSources[idx] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {expandedSources[idx] && (
                      <div className="mt-2 space-y-1.5 pl-2 border-l border-cyan-400/30">
                        {msg.sources.map((src, sIdx) => (
                          <div key={sIdx} className="text-xs text-slate-300">
                            <span className="font-semibold text-white">{src.course_name || 'Curso'}:</span>{' '}
                            <span>{src.activity_name || src.chapter_name || 'Aula'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons (copy, thumbs) */}
                <div className="gxeon-bot-actions">
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.content, idx)}
                    className="gxeon-action-icon-btn"
                    title="Copiar resposta"
                    aria-label="Copiar resposta"
                  >
                    {copiedIndex === idx ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                  <button
                    type="button"
                    className="gxeon-action-icon-btn"
                    title="Resposta útil"
                    aria-label="Resposta útil"
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button
                    type="button"
                    className="gxeon-action-icon-btn"
                    title="Resposta precisa de ajustes"
                    aria-label="Resposta precisa de ajustes"
                  >
                    <ThumbsDown size={14} />
                  </button>
                  <span className="ml-auto text-[10px] text-slate-500">{time}</span>
                </div>
              </div>
            </div>
          )
        })}

        {isStreaming && (
          <div className="gxeon-bot-message-row">
            <div className="gxeon-bot-avatar shrink-0 w-8 h-8 text-xs font-black animate-pulse" aria-hidden="true">
              GX
            </div>
            <div className="gxeon-bot-card flex items-center gap-2 text-xs text-cyan-400 py-3">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>GXEON está pensando e estruturando a resposta...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Bar */}
      <form onSubmit={handleSubmit} className="gxeon-composer-bar">
        <div className="gxeon-input-wrapper">
          <button
            type="button"
            className="gxeon-action-icon-btn text-slate-400 hover:text-white"
            title="Anexar arquivo ou contexto"
            aria-label="Anexar arquivo ou contexto"
          >
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Pergunte ao GXEON sobre seus cursos, projetos, conteúdos..."
            className="gxeon-input-field"
            disabled={isStreaming}
            aria-label="Mensagem para o GXEON Copilot"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isStreaming}
            className="gxeon-send-btn"
            aria-label="Enviar mensagem"
            title="Enviar mensagem"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </section>
  )
}
