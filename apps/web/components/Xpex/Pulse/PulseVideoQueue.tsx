'use client'

import React from 'react'
import type { PulseVideoItem } from '@/types/pulse'

interface PulseVideoQueueProps {
  videos: PulseVideoItem[]
  activeVideoId: string
  onSelectVideo: (_video: PulseVideoItem) => void
}

export function PulseVideoQueue({
  videos,
  activeVideoId,
  onSelectVideo,
}: PulseVideoQueueProps) {
  const activeIndex = videos.findIndex((v) => v.id === activeVideoId)
  const currentIndexLabel = activeIndex >= 0 ? activeIndex + 1 : 1

  return (
    <aside className="pulse-video-queue-panel" aria-label="Fila de Próximos Vídeos">
      <div className="pulse-queue-header">
        <div className="pulse-queue-title-row">
          <h3 className="pulse-queue-title">Próximos da fila</h3>
          <span className="pulse-queue-badge">
            {currentIndexLabel}/{videos.length} vídeos
          </span>
        </div>
        <p className="pulse-queue-subtitle">Clique para reproduzir imediatamente</p>
      </div>

      <div className="pulse-queue-list" role="list">
        {videos.map((video, index) => {
          const isActive = video.id === activeVideoId
          return (
            <div
              key={video.id}
              role="listitem"
              tabIndex={0}
              className={`pulse-queue-item ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectVideo(video)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectVideo(video)
                }
              }}
              aria-label={`Vídeo ${index + 1}: ${video.title}. ${isActive ? 'Em reprodução no momento.' : 'Clique para reproduzir.'}`}
            >
              <div className="pulse-queue-thumb-wrapper">
                <div className="pulse-queue-thumb-overlay">
                  {isActive ? (
                    <span className="pulse-mini-equalizer" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                  ) : (
                    <span className="pulse-play-icon" aria-hidden="true">▶</span>
                  )}
                </div>
                {video.durationLabel && (
                  <span className="pulse-queue-duration">{video.durationLabel}</span>
                )}
              </div>

              <div className="pulse-queue-item-body">
                <h4 className="pulse-queue-item-title">{video.title}</h4>
                <div className="pulse-queue-item-meta">
                  <span className="pulse-queue-channel">{video.channelName}</span>
                  {video.viewsCountLabel && (
                    <span className="pulse-queue-views">• {video.viewsCountLabel}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
