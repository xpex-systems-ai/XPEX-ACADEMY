import React from 'react'
import { Play } from 'lucide-react'
import type { PulseVideoItem } from '@/types/pulse'

interface PulseVideoBlockProps {
  items: PulseVideoItem[]
  label: string
}

/** Vídeos Curados block — YouTube official embeds only, no download/re-host. */
export function PulseVideoBlock({ items, label }: PulseVideoBlockProps) {
  return (
    <section className="pulse-section" aria-labelledby="pulse-videos-heading">
      <div className="pulse-section-header">
        <div className="pulse-section-title-group">
          <div className="pulse-section-icon orange" aria-hidden="true">
            <Play size={16} />
          </div>
          <h2 id="pulse-videos-heading" className="pulse-section-title">
            Vídeos <span>Curados</span>
          </h2>
        </div>
        <span className="pulse-section-label">{label}</span>
      </div>

      <div className="pulse-grid-4">
        {items.map((video) => (
          <article key={video.id} className="pulse-video-card">
            <div className="pulse-video-thumb">
              <iframe
                src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
            <div className="pulse-video-body">
              <h3 className="pulse-video-title">{video.title}</h3>
              <div className="pulse-video-meta">
                <span className="pulse-video-channel">{video.channelName}</span>
                {video.durationLabel && (
                  <span className="pulse-video-duration">{video.durationLabel}</span>
                )}
              </div>
              <p className="pulse-video-desc">{video.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
