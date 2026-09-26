import React from 'react'
import { Newspaper } from 'lucide-react'
import type { PulseNewsItem } from '@/types/pulse'

interface PulseNewsBlockProps {
  items: PulseNewsItem[]
  label: string
}

/** Notícias/Atualizações block — curated external links, no scraping. */
export function PulseNewsBlock({ items, label }: PulseNewsBlockProps) {
  return (
    <section className="pulse-section" aria-labelledby="pulse-news-heading">
      <div className="pulse-section-header">
        <div className="pulse-section-title-group">
          <div className="pulse-section-icon" aria-hidden="true">
            <Newspaper size={16} />
          </div>
          <h2 id="pulse-news-heading" className="pulse-section-title cyan">
            Notícias <span>Atualizadas</span>
          </h2>
        </div>
        <span className="pulse-section-label">{label}</span>
      </div>

      <div className="pulse-grid-2">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.url ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="pulse-news-card"
            aria-label={`Leia: ${item.title} — fonte: ${item.source ?? item.domain}`}
          >
            <div className="pulse-news-icon" aria-hidden="true">
              <Newspaper size={16} />
            </div>
            <div className="pulse-news-content">
              <h3 className="pulse-news-title">{item.title}</h3>
              <p className="pulse-news-desc">{item.description}</p>
              {item.source && (
                <span className="pulse-news-source">{item.source}</span>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
