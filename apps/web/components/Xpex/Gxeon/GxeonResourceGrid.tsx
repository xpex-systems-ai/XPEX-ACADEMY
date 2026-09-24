'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Database,
  FileText,
  FolderKanban,
  LibraryBig,
  Route,
  Sparkles,
  TerminalSquare,
  Users,
  Workflow,
} from 'lucide-react'

export interface GxeonResourceGridProps {
  organizationSlug: string
  nativeWorkspaceAvailable: boolean
  onOpenCopilot?: () => void
}

export function GxeonResourceGrid({
  organizationSlug,
  nativeWorkspaceAvailable,
  onOpenCopilot,
}: GxeonResourceGridProps) {
  const resources = [
    {
      eyebrow: 'GX STUDIO',
      title: 'Prompt Engineering',
      desc: 'Estruture objetivos, compare estratégias e refine prompts com o GX.',
      cta: 'Praticar agora',
      href: '#gxeon-chat',
      icon: Sparkles,
      onClick: onOpenCopilot,
      available: true,
    },
    {
      eyebrow: 'CORE XPeX',
      title: 'RAG e conhecimento privado',
      desc: 'Use o Copilot/RAG nativo sobre seu conteúdo autorizado.',
      cta: 'Abrir bancada',
      href: '#gxeon-chat',
      icon: Database,
      onClick: onOpenCopilot,
      available: true,
    },
    {
      eyebrow: 'CONTEÚDO XPeX',
      title: 'Atividades do curso',
      desc: 'Veja suas atividades publicadas e avance com progresso real.',
      cta: 'Continuar',
      href: '/xpex/activities',
      icon: FileText,
      available: true,
    },
    {
      eyebrow: 'LAB 002',
      title: 'Workspace de Projetos GX',
      desc: 'Templates de IA aplicada, automações e projetos guiados.',
      cta: 'Abrir workspace',
      href: '/xpex/ai-lab/projects',
      icon: FolderKanban,
      available: true,
    },
    {
      eyebrow: 'CORE XPeX',
      title: 'Boards',
      desc: 'Planeje tarefas, milestones e entregas no workspace nativo.',
      cta: 'Planejar projeto',
      href: nativeWorkspaceAvailable ? `/orgs/${organizationSlug}/boards` : null,
      icon: Workflow,
      available: nativeWorkspaceAvailable,
      fallbackText: 'Indisponível neste Polo',
    },
    {
      eyebrow: 'CORE XPeX',
      title: 'Library',
      desc: 'Organize fontes, apostilas e referências da sua organização.',
      cta: 'Organizar fontes',
      href: nativeWorkspaceAvailable ? `/orgs/${organizationSlug}/library` : null,
      icon: LibraryBig,
      available: nativeWorkspaceAvailable,
      fallbackText: 'Indisponível neste Polo',
    },
    {
      eyebrow: 'ECOSSISTEMA XPeX',
      title: 'Trilhas profissionais',
      desc: 'Combine o curso atual com academias e orientação do GX.',
      cta: 'Explorar trilhas',
      href: '/xpex/trails',
      icon: Route,
      available: true,
    },
    {
      eyebrow: 'CORE XPeX',
      title: 'Comunidade',
      desc: 'Compartilhe dúvidas, projetos e aprendizados com outros alunos.',
      cta: 'Abrir comunidade',
      href: '/xpex/community',
      icon: Users,
      available: true,
    },
    {
      eyebrow: 'ROADMAP SEGURO',
      title: 'Modelos, APIs e sandboxes',
      desc: 'Execução isolada com quota, persistência e governança.',
      cta: 'Em preparação',
      href: null,
      icon: TerminalSquare,
      available: false,
      fallbackText: 'Em preparação',
    },
  ]

  return (
    <section aria-label="Recursos integrados do GXEON" className="mt-4">
      <div className="gxeon-resources-header">
        <div>
          <h2 className="gxeon-resources-title">Explore com o GXEON</h2>
          <p className="gxeon-resources-sub">
            Recursos integrados para acelerar seu aprendizado e seus projetos.
          </p>
        </div>
        <Link href="/xpex/ai-lab" className="gxeon-resources-all-link">
          <span>Ver todos os recursos</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="gxeon-resources-grid">
        {resources.map((item, idx) => {
          const Icon = item.icon
          const isLink = item.available && item.href

          return (
            <article key={idx} className="gxeon-resource-card">
              <div className="gxeon-resource-card-top">
                <span className="gxeon-resource-eyebrow">{item.eyebrow}</span>
                <Icon size={18} className="gxeon-resource-icon" aria-hidden="true" />
              </div>
              <h3 className="gxeon-resource-title">{item.title}</h3>
              <p className="gxeon-resource-desc">{item.desc}</p>

              {isLink ? (
                item.onClick ? (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="gxeon-resource-cta self-start"
                  >
                    <span>{item.cta}</span>
                    <ArrowRight size={13} />
                  </button>
                ) : (
                  <Link href={item.href!} className="gxeon-resource-cta self-start">
                    <span>{item.cta}</span>
                    <ArrowRight size={13} />
                  </Link>
                )
              ) : (
                <span className="gxeon-resource-disabled">
                  {item.fallbackText || item.cta}
                </span>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
