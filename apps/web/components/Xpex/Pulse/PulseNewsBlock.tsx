'use client'

import React from 'react'
import type { PulseNewsItem } from '@/types/pulse'

interface PulseNewsBlockProps {
  items: PulseNewsItem[]
  label?: string
}

export function PulseNewsBlock({ items, label = 'Atualizado' }: PulseNewsBlockProps) {
  return (
    <section className="pulse-news-panel" aria-label="Notícias Atualizadas do Mercado">
      <div className="pulse-panel-header">
        <div className="pulse-panel-title-wrap">
          <span className="pulse-panel-accent-tag">FEED GLOBAL</span>
          <h3 className="pulse-panel-title">NOTÍCIAS ATUALIZADAS</h3>
        </div>
        <span className="pulse-label-badge">{label}</span>
      </div>

      <div className="pulse-news-list" role="feed">
        {items.map((news) => (
          <article key={news.id} className="pulse-news-item" tabIndex={0}>
            <div className="pulse-news-meta-top">
              <span className="pulse-news-source">{news.source || 'Fonte Especializada'}</span>
              <span className="pulse-news-time">{news.publishedRelative || 'Hoje'}</span>
            </div>

            <h4 className="pulse-news-title">
              {news.url ? (
                <a
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pulse-news-headline-link"
                >
                  {news.title}
                </a>
              ) : (
                news.title
              )}
            </h4>

            <p className="pulse-news-snippet">{news.description}</p>

            <div className="pulse-news-footer">
              <span className="pulse-news-readtime">⏱ {news.readTimeMinutes || 4} min de leitura</span>
              {news.url && (
                <a
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pulse-news-read-more"
                  aria-label={`Ler notícia completa: ${news.title}`}
                >
                  Ler na íntegra ↗
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
