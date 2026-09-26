'use client'

import React, { useState, useTransition } from 'react'
import { PULSE_CATEGORIES, searchPulse } from '@services/pulse/pulse'
import type { PulseCategory, PulseItem } from '@/types/pulse'

interface PulseToolbarProps {
  activeCategory: PulseCategory
  onCategoryChange: (_category: PulseCategory) => void
  onSearchActive: (_active: boolean) => void
  onResults: (_results: PulseItem[]) => void
  onQuery: (_query: string) => void
}

export function PulseToolbar({
  activeCategory,
  onCategoryChange,
  onSearchActive,
  onResults,
  onQuery,
}: PulseToolbarProps) {
  const [query, setQuery] = useState('')
  const [, startTransition] = useTransition()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    onQuery(val)

    startTransition(() => {
      if (val.trim()) {
        const res = searchPulse(val, activeCategory)
        onResults(res.items)
        onSearchActive(true)
      } else {
        onResults([])
        onSearchActive(false)
      }
    })
  }

  const handleCategoryClick = (catId: PulseCategory) => {
    onCategoryChange(catId)
    if (query.trim()) {
      const res = searchPulse(query, catId)
      onResults(res.items)
    }
  }

  const handleClear = () => {
    setQuery('')
    onQuery('')
    onResults([])
    onSearchActive(false)
  }

  return (
    <nav className="pulse-toolbar" id="pulse-toolbar" aria-label="Filtros e Busca do XPeX Pulse">
      <div className="pulse-search-box">
        <label htmlFor="pulse-search-input" className="sr-only">
          Busque conteúdos no XPeX Pulse
        </label>
        <div className="pulse-search-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          id="pulse-search-input"
          type="search"
          className="pulse-search-input"
          placeholder="Busque vídeos, notícias, tecnologias, criadores, temas..."
          value={query}
          onChange={handleInputChange}
          autoComplete="off"
          aria-label="Campo de busca de conteúdos no Pulse"
        />
        {query && (
          <button
            type="button"
            className="pulse-search-clear"
            onClick={handleClear}
            aria-label="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      <div className="pulse-categories-rail" role="tablist" aria-label="Categorias de conteúdo">
        {PULSE_CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isSelected}
              className={`pulse-category-pill ${isSelected ? 'is-active' : ''}`}
              onClick={() => handleCategoryClick(cat.id)}
            >
              <span>{cat.label}</span>
              {typeof cat.count === 'number' && (
                <span className="pulse-category-count" aria-hidden="true">
                  {cat.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

interface PulseSearchResultsViewProps {
  items: PulseItem[]
  query: string
  onSelectItem?: (_item: PulseItem) => void
}

export function PulseSearchResultsView({ items, query, onSelectItem }: PulseSearchResultsViewProps) {
  if (items.length === 0) {
    return (
      <section className="pulse-search-results" aria-label="Resultados da busca">
        <div className="pulse-empty-state">
          <p className="pulse-empty-title">Nenhum resultado encontrado para &quot;{query}&quot;</p>
          <p className="pulse-empty-desc">
            Tente buscar por termos como &quot;IA&quot;, &quot;Agentes&quot;, &quot;Prompt&quot;, &quot;RAG&quot; ou &quot;Python&quot;.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="pulse-search-results" aria-label={`Resultados para ${query}`}>
      <div className="pulse-results-header">
        <h2 className="pulse-results-title">
          Resultados para <span className="pulse-query-highlight">&quot;{query}&quot;</span>
        </h2>
        <span className="pulse-results-count">{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
      </div>

      <div className="pulse-results-grid">
        {items.map((item) => (
          <article key={item.id} className="pulse-result-card">
            <div className="pulse-result-badge-row">
              <span className="pulse-chip-category">{item.category.toUpperCase()}</span>
              <span className="pulse-label-badge">{item.label}</span>
            </div>
            <h3 className="pulse-result-title">{item.title}</h3>
            <p className="pulse-result-desc">{item.description}</p>
            {item.source && (
              <span className="pulse-result-source">Fonte: {item.source}</span>
            )}
            <div className="pulse-result-actions">
              {item.category === 'videos' && item.youtubeId ? (
                <button
                  type="button"
                  className="pulse-action-btn-primary"
                  onClick={() => onSelectItem?.(item)}
                >
                  Assistir no Player
                </button>
              ) : item.url ? (
                <a
                  href={item.url}
                  target={item.url.startsWith('http') ? '_blank' : '_self'}
                  rel={item.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="pulse-action-link"
                >
                  Ver Conteúdo →
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
