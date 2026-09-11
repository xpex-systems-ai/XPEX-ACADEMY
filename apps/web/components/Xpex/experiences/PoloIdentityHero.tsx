import Image from 'next/image'
import { MapPin, Sparkles, Users } from 'lucide-react'
import type { PoloBranding } from '@/lib/xpex/polo-branding'

export function PoloIdentityHero({ branding }: { branding: PoloBranding }) {
  const hasCoordinator = Boolean(branding.teacher_photo || branding.coordinator_name)

  return (
    <section
      className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950/70 shadow-2xl"
      style={{ backgroundColor: branding.background, borderColor: branding.accent_color }}
      aria-label={`Identidade do polo ${branding.organization_name}`}
    >
      {branding.hero_image ? (
        <div className="absolute inset-0" aria-hidden="true">
          <Image src={branding.hero_image} alt="" fill unoptimized className="object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/45" />
        </div>
      ) : null}

      <div className="relative grid gap-8 px-6 py-8 md:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10 lg:py-10">
        <div className="max-w-3xl">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            {branding.logo ? (
              <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2">
                <Image src={branding.logo} alt={`Logo ${branding.organization_name}`} width={48} height={48} unoptimized className="max-h-full max-w-full object-contain" />
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
              <Sparkles size={14} aria-hidden="true" /> Visão institucional
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">{branding.organization_name}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
            {branding.tagline ?? 'Acompanhe sua organização e as ferramentas autorizadas para sua conta.'}
          </p>

          {(branding.location || branding.coordinator_name) ? (
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
              {branding.location ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2">
                  <MapPin size={15} aria-hidden="true" /> {branding.location}
                </span>
              ) : null}
              {branding.coordinator_name ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2">
                  <Users size={15} aria-hidden="true" /> Coordenação: {branding.coordinator_name}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {hasCoordinator ? (
          <aside className="min-w-0 lg:w-72" aria-label="Coordenação do polo">
            <div className="rounded-[26px] border border-white/10 bg-black/25 p-4 backdrop-blur-sm">
              {branding.teacher_photo ? (
                <div className="relative mx-auto aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-[22px] border border-white/10 bg-slate-900">
                  <Image
                    src={branding.teacher_photo}
                    alt={branding.coordinator_name ?? 'Coordenação do polo'}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : null}
              {branding.coordinator_name ? (
                <div className="mt-4 text-center">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Coordenação</span>
                  <strong className="mt-1 block text-base text-white">{branding.coordinator_name}</strong>
                </div>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  )
}
