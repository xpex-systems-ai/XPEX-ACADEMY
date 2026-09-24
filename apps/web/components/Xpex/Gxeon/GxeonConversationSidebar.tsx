'use client'

import React from 'react'
import { Plus, MessageSquare, Clock } from 'lucide-react'
import type { RAGChatSession } from '@services/ai/ai'

export interface GxeonConversationSidebarProps {
  sessions: RAGChatSession[]
  activeSessionUuid: string | null
  onSelectSession: (_uuid: string) => void
  onNewChat: () => void
  loading?: boolean
}

export function GxeonConversationSidebar({
  sessions,
  activeSessionUuid,
  onSelectSession,
  onNewChat,
  loading = false,
}: GxeonConversationSidebarProps) {
  // Group sessions by date
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)

  const hoje: RAGChatSession[] = []
  const ultimosSeteDias: RAGChatSession[] = []
  const maisAntigas: RAGChatSession[] = []

  for (const s of sessions) {
    const d = new Date(s.created_at)
    if (d >= todayStart) {
      hoje.push(s)
    } else if (d >= weekAgo) {
      ultimosSeteDias.push(s)
    } else {
      maisAntigas.push(s)
    }
  }

  const hasAnySessions = sessions.length > 0

  return (
    <aside className="gxeon-history-pane" aria-label="Histórico de conversas do GXEON">
      <button
        type="button"
        onClick={onNewChat}
        className="gxeon-new-chat-btn"
        aria-label="Iniciar nova conversa com o GXEON"
      >
        <Plus size={16} />
        <span>+ Nova conversa</span>
      </button>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {loading && (
          <div className="flex items-center justify-center p-4 text-xs text-slate-500 gap-2">
            <Clock size={14} className="animate-spin text-cyan-400" />
            <span>Carregando conversas...</span>
          </div>
        )}

        {!loading && !hasAnySessions && (
          <div className="p-4 text-center text-xs text-slate-500">
            <p>Nenhuma conversa ainda.</p>
            <p className="mt-1 text-[11px] text-slate-600">Inicie uma conversa para ver seu histórico aqui.</p>
          </div>
        )}

        {hoje.length > 0 && (
          <div>
            <div className="gxeon-history-section-title">Hoje</div>
            <div className="space-y-1">
              {hoje.map((session) => {
                const isActive = session.aichat_uuid === activeSessionUuid
                return (
                  <button
                    key={session.aichat_uuid}
                    type="button"
                    onClick={() => onSelectSession(session.aichat_uuid)}
                    className={`gxeon-history-item w-full text-left ${isActive ? 'active' : ''}`}
                    title={session.title || 'Conversa sem título'}
                  >
                    <span className="truncate">{session.title || 'Conversa sem título'}</span>
                    <MessageSquare size={13} className="shrink-0 text-slate-500" />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {ultimosSeteDias.length > 0 && (
          <div>
            <div className="gxeon-history-section-title">Últimos 7 dias</div>
            <div className="space-y-1">
              {ultimosSeteDias.map((session) => {
                const isActive = session.aichat_uuid === activeSessionUuid
                return (
                  <button
                    key={session.aichat_uuid}
                    type="button"
                    onClick={() => onSelectSession(session.aichat_uuid)}
                    className={`gxeon-history-item w-full text-left ${isActive ? 'active' : ''}`}
                    title={session.title || 'Conversa sem título'}
                  >
                    <span className="truncate">{session.title || 'Conversa sem título'}</span>
                    <MessageSquare size={13} className="shrink-0 text-slate-500" />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {maisAntigas.length > 0 && (
          <div>
            <div className="gxeon-history-section-title">Mais antigas</div>
            <div className="space-y-1">
              {maisAntigas.map((session) => {
                const isActive = session.aichat_uuid === activeSessionUuid
                return (
                  <button
                    key={session.aichat_uuid}
                    type="button"
                    onClick={() => onSelectSession(session.aichat_uuid)}
                    className={`gxeon-history-item w-full text-left ${isActive ? 'active' : ''}`}
                    title={session.title || 'Conversa sem título'}
                  >
                    <span className="truncate">{session.title || 'Conversa sem título'}</span>
                    <MessageSquare size={13} className="shrink-0 text-slate-500" />
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
