'use client'

import React, { useState, type FormEvent } from 'react'
import { Search, Play, Layers, Brain } from 'lucide-react'
import { searchPulse } from '@services/pulse/pulse'
import type { PulseItem } from '@/types/pulse'

const CATEGORY_LABELS: Record<string, string> = {
  videos: 'Vídeo',
  news: 'Notícia',
  trends: 'Tendência',
  tech: 'Tecnologia',
  radar: 'Radar XPeX',
  xara: 'XARA',
}

interface PulseToolbarProps {
  onSearchActive: (_active: boolean) => void
  onResults: (_results: PulseItem[]) => void
  onQuery: (_q: string) => void
}

export function PulseToolbar({ onSearchActive, onResults, onQuery }: PulseToolbarProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) {
      onSearchActive(false)
      onResults([])
      onQuery('')
      return
    }
    const result = searchPulse(trimmed)
    onResults(result.items)
    onQuery(trimmed)
    onSearchActive(true)
  }

  const handleClear = () => {
    setQuery('')
    onSearchActive(false)
    onResults([])
    onQuery('')
  }

  return (
    <div className="pulse-toolbar">
      <form className="pulse-search-form" onSubmit={handleSubmit} role="search">
        <Search className="pulse-search-icon" size={16} aria-hidden="true" />
        <span className="sr-only">Busca inteligente no Pulse</span>
        <input
          className="pulse-search-input"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!e.target.value.trim()) handleClear()
          }}
          placeholder="Encontre vídeos, notícias e conteúdos..."
          aria-label="Buscar no XPeX Pulse"
        />
      </form>

      <div className="pulse-toolbar-features" aria-label="Recursos do Pulse">
        <div className="pulse-feature-chip">
          <Play size={12} aria-hidden="true" />
          Player integrado
        </div>
        <div className="pulse-feature-chip">
          <Layers size={12} aria-hidden="true" />
          Canais curados
        </div>
        <div className="pulse-feature-chip">
          <Brain size={12} aria-hidden="true" />
          Trilhas personalizadas
        </div>
      </div>
    </div>
  )
}

interface PulseSearchResultsViewProps {
  items: PulseItem[]
  query: string
}

export function PulseSearchResultsView({ items, query }: PulseSearchResultsViewProps) {
  if (items.length === 0) {
    return (
      <section className="pulse-section" aria-live="polite">
        <div className="pulse-search-empty">
          <p>Nenhum resultado encontrado para <strong>&ldquo;{query}&rdquo;</strong></p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.65 }}>
            Tente outros termos: IA, Python, Web3, tendências...
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="pulse-section" aria-live="polite" aria-labelledby="pulse-search-heading">
      <div className="pulse-section-header">
        <h2 id="pulse-search-heading" className="pulse-section-title">
          Resultados para <span>&ldquo;{query}&rdquo;</span>
        </h2>
        <span className="pulse-section-label">{items.length} encontrado{items.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="pulse-search-results">
        {items.map((item) => {
          const isExternal = item.url?.startsWith('http')
          const Tag = isExternal ? 'a' : 'div'
          const tagProps = isExternal
            ? { href: item.url!, target: '_blank', rel: 'noopener noreferrer' }
            : {}
          return (
            <Tag
              key={item.id}
              className="pulse-search-result-card"
              {...tagProps}
            >
              <span className="pulse-search-badge">{CATEGORY_LABELS[item.category] ?? item.category}</span>
              <div>
                <p className="pulse-search-result-title">{item.title}</p>
                <p className="pulse-search-result-desc">{item.description}</p>
              </div>
            </Tag>
          )
        })}
      </div>
    </section>
  )
}
