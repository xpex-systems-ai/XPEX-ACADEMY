'use client'

import React from 'react'
import type { PulseVideoItem } from '@/types/pulse'

interface PulseCuratedVideosProps {
  items: PulseVideoItem[]
  label?: string
  onSelectVideo?: (_video: PulseVideoItem) => void
}

export function PulseCuratedVideos({
  items,
  label = 'Curado',
  onSelectVideo,
}: PulseCuratedVideosProps) {
  return (
    <section className="pulse-curated-section" id="pulse-curated-videos" aria-label="Vídeos Curados de IA">
      <div className="pulse-section-header">
        <div className="pulse-section-title-group">
          <div className="pulse-section-badge-row">
            <span className="pulse-badge-accent">ACADEMY SELECTION</span>
            <span className="pulse-label-badge">{label}</span>
          </div>
          <h3 className="pulse-section-title">VÍDEOS CURADOS</h3>
          <p className="pulse-section-subtitle">
            Aulas, análises e tutoriais selecionados minuciosamente para maximizar seu tempo.
          </p>
        </div>

        <a
          href="https://www.youtube.com/results?search_query=inteligencia+artificial+agentes"
          target="_blank"
          rel="noopener noreferrer"
          className="pulse-section-link"
        >
          <span>Ver todos no YouTube</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>

      <div className="pulse-curated-grid">
        {items.map((video) => (
          <article
            key={video.id}
            className="pulse-curated-card"
            onClick={() => onSelectVideo?.(video)}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelectVideo?.(video)
              }
            }}
            aria-label={`Vídeo: ${video.title} por ${video.channelName}. Clique para assistir.`}
          >
            <div className="pulse-curated-thumb">
              <div className="pulse-curated-thumb-bg">
                <span className="pulse-card-play-btn" aria-hidden="true">▶</span>
              </div>
              {video.durationLabel && (
                <span className="pulse-curated-duration">{video.durationLabel}</span>
              )}
            </div>

            <div className="pulse-curated-card-body">
              <div className="pulse-curated-meta-top">
                <span className="pulse-curated-channel">{video.channelName}</span>
                {video.label && <span className="pulse-label-pill">{video.label}</span>}
              </div>

              <h4 className="pulse-curated-title">{video.title}</h4>
              <p className="pulse-curated-desc">{video.description}</p>

              <div className="pulse-curated-footer">
                <span className="pulse-curated-views">
                  {video.viewsCountLabel || 'Curadoria XPeX'}
                </span>
                <span className="pulse-curated-action">Assistir agora →</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
