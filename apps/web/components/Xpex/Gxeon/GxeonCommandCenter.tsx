'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { GxeonHero } from './GxeonHero'
import { GxeonConversationSidebar } from './GxeonConversationSidebar'
import { GxeonChatShell, type ChatMessage } from './GxeonChatShell'
import { GxeonMetricsRow } from './GxeonMetricsRow'
import { GxeonResourceGrid } from './GxeonResourceGrid'
import {
  fetchRAGChatSessions,
  fetchRAGChatMessages,
  startRAGChatStream,
  sendRAGChatStream,
  fetchAIGatewayHealth,
  type RAGChatSession,
  type AIGatewayHealthResponse,
  type StreamSourceData,
  type StreamDoneData,
} from '@services/ai/ai'
import './gxeon.css'

export interface GxeonCommandCenterProps {
  accessToken: string
  organizationSlug: string
  displayName: string
  enrolledCoursesCount: number
  availableLessonsCount: number
  overallProgress: number
  nativeWorkspaceAvailable: boolean
}

export function GxeonCommandCenter({
  accessToken,
  organizationSlug,
  displayName,
  enrolledCoursesCount,
  availableLessonsCount,
  overallProgress,
  nativeWorkspaceAvailable,
}: GxeonCommandCenterProps) {
  const [sessions, setSessions] = useState<RAGChatSession[]>([])
  const [activeSessionUuid, setActiveSessionUuid] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [gatewayHealth, setGatewayHealth] = useState<AIGatewayHealthResponse | null>(null)

  // Compute initials e.g. "Aloisio Kelle" -> "AK"
  const userInitials =
    displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'XP'

  // Load gateway health
  useEffect(() => {
    let mounted = true
    async function loadHealth() {
      const health = await fetchAIGatewayHealth(accessToken)
      if (mounted) {
        setGatewayHealth(health)
      }
    }
    loadHealth()
    return () => {
      mounted = false
    }
  }, [accessToken])

  // Load RAG sessions
  const refreshSessions = useCallback(async () => {
    try {
      setSessionsLoading(true)
      const data = await fetchRAGChatSessions(accessToken, organizationSlug)
      setSessions(data)
    } catch {
      // Graceful fallback to empty sessions
      setSessions([])
    } finally {
      setSessionsLoading(false)
    }
  }, [accessToken, organizationSlug])

  useEffect(() => {
    let isCancelled = false
    async function loadInitialSessions() {
      try {
        setSessionsLoading(true)
        const data = await fetchRAGChatSessions(accessToken, organizationSlug)
        if (!isCancelled) {
          setSessions(data)
        }
      } catch {
        if (!isCancelled) setSessions([])
      } finally {
        if (!isCancelled) setSessionsLoading(false)
      }
    }
    loadInitialSessions()
    return () => {
      isCancelled = true
    }
  }, [accessToken, organizationSlug])

  // Handle session selection
  const handleSelectSession = useCallback(
    async (sessionUuid: string) => {
      if (sessionUuid === activeSessionUuid) return
      setActiveSessionUuid(sessionUuid)
      setIsStreaming(false)
      try {
        const rawMessages = await fetchRAGChatMessages(sessionUuid, accessToken)
        const formatted: ChatMessage[] = rawMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          sources: m.sources,
        }))
        setMessages(formatted)
      } catch {
        setMessages([])
      }
    },
    [activeSessionUuid, accessToken]
  )

  // Start a new chat
  const handleNewChat = useCallback(() => {
    setActiveSessionUuid(null)
    setMessages([])
    setIsStreaming(false)
  }, [])

  // Send message with streaming
  const handleSendMessage = useCallback(
    async (text: string) => {
      // Append user message immediately
      const userMsg: ChatMessage = {
        role: 'user',
        content: text,
      }
      setMessages((prev) => [...prev, userMsg])
      setIsStreaming(true)

      let assistantResponse = ''
      let returnedSources: StreamSourceData['sources'] = []

      // Prepare assistant placeholder message
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '',
        },
      ])

      const callbacks = {
        onChunk: (chunk: string) => {
          assistantResponse += chunk
          setMessages((prev) => {
            const copy = [...prev]
            if (copy.length > 0 && copy[copy.length - 1].role === 'assistant') {
              copy[copy.length - 1] = {
                ...copy[copy.length - 1],
                content: assistantResponse,
              }
            }
            return copy
          })
        },
        onSources: (sourcesData: StreamSourceData) => {
          returnedSources = sourcesData.sources
          setMessages((prev) => {
            const copy = [...prev]
            if (copy.length > 0 && copy[copy.length - 1].role === 'assistant') {
              copy[copy.length - 1] = {
                ...copy[copy.length - 1],
                sources: returnedSources,
              }
            }
            return copy
          })
        },
        onComplete: (doneData: StreamDoneData) => {
          setIsStreaming(false)
          const aichatUuid = doneData.aichat_uuid
          if (aichatUuid && !activeSessionUuid) {
            setActiveSessionUuid(aichatUuid)
            refreshSessions()
          }
        },
        onError: (_errorMsg: string) => {
          setIsStreaming(false)
          setMessages((prev) => {
            const copy = [...prev]
            if (copy.length > 0 && copy[copy.length - 1].role === 'assistant') {
              copy[copy.length - 1] = {
                ...copy[copy.length - 1],
                content:
                  copy[copy.length - 1].content ||
                  'O GX está temporariamente indisponível. Seu curso continua disponível normalmente. Tente novamente em instantes.',
              }
            }
            return copy
          })
        },
      }

      if (activeSessionUuid) {
        await sendRAGChatStream(
          text,
          activeSessionUuid,
          accessToken,
          callbacks,
          undefined,
          'general',
          organizationSlug
        )
      } else {
        await startRAGChatStream(
          text,
          accessToken,
          callbacks,
          undefined,
          'general',
          organizationSlug
        )
      }
    },
    [activeSessionUuid, accessToken, organizationSlug, refreshSessions]
  )

  const handleScrollToCopilot = () => {
    const el = document.getElementById('gxeon-chat')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="gxeon-container">
      {/* 1. Main Hero Card */}
      <GxeonHero />

      {/* 2. Central Copilot Workspace (2 Columns) */}
      <div id="gxeon-chat" className="gxeon-workspace-card scroll-mt-24">
        <GxeonConversationSidebar
          sessions={sessions}
          activeSessionUuid={activeSessionUuid}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          loading={sessionsLoading}
        />
        <GxeonChatShell
          messages={messages}
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          gatewayHealth={gatewayHealth}
          userInitials={userInitials}
          userName={displayName}
        />
      </div>

      {/* 3. Real Metrics Row (4 Cards) */}
      <GxeonMetricsRow
        enrolledCoursesCount={enrolledCoursesCount}
        availableLessonsCount={availableLessonsCount}
        overallProgress={overallProgress}
        gatewayHealth={gatewayHealth}
      />

      {/* 4. Explore com o GXEON Resource Grid */}
      <GxeonResourceGrid
        organizationSlug={organizationSlug}
        nativeWorkspaceAvailable={nativeWorkspaceAvailable}
        onOpenCopilot={handleScrollToCopilot}
      />
    </div>
  )
}
