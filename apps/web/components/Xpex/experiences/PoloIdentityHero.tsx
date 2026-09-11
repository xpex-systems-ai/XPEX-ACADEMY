import Image from 'next/image'
import { MapPin, Sparkles, Users } from 'lucide-react'
import type { PoloBranding } from '@/lib/xpex/polo-branding'

const withAlpha = (hex: string | undefined, alpha: string) => {
  if (!hex || !/^#[\da-f]{6}$/i.test(hex)) return undefined
  return `${hex}${alpha}`
}

export function PoloIdentityHero({ branding }: { branding: PoloBranding }) {
  const primary = branding.primary_color ?? '#ff7a00'
  const accent = branding.accent_color ?? '#00d4ff'
  const background = branding.background ?? '#07111f'
  const hasCoordinator = Boolean(branding.teacher_photo || branding.coordinator_name)

  return (
    <section
      className="relative min-h-[330px] overflow-hidden rounded-[30px] border shadow-2xl"
      style={{
        borderColor: withAlpha(accent, '45'),
        background: `radial-gradient(circle at 72% 32%, ${withAlpha(primary, '24') ?? '#ff7a0024'} 0%, transparent 30%), radial-gradient(circle at 48% 100%, ${withAlpha(accent, '20') ?? '#00d4ff20'} 0%, transparent 42%), linear-gradient(135deg, ${background} 0%, #071522 58%, #08111a 100%)`,
      }}
      aria-label={`Identidade do polo ${branding.organization_name}`}
    >
      {branding.hero_image ? (
        <div className="absolute inset-0" aria-hidden="true">
          <Image src={branding.hero_image} alt="" fill unoptimized className="object-cover opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
        </div>
      ) : null}

      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-14 text-[18rem] font-black leading-none opacity-[0.06]" style={{ color: primary }}>X</div>
      <div aria-hidden="true" className="pointer-events-none absolute left-[34%] top-0 h-px w-[52%]" style={{ background: `linear-gradient(90deg, transparent, ${accent}, ${primary}, transparent)` }} />

      <div className="relative grid min-h-[330px] gap-8 px-6 py-8 md:px-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:px-10 lg:py-10">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {branding.logo ? (
              <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2">
                <Image src={branding.logo} alt={`Logo ${branding.organization_name}`} width={48} height={48} unoptimized className="max-h-full max-w-full object-contain" />
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-300">
              <Sparkles size={15} aria-hidden="true" style={{ color: accent }} /> Bem-vindo ao Polo
            </span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">
            {branding.organization_name}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            {branding.tagline ?? 'Acompanhe sua organização e as ferramentas autorizadas para sua conta.'}
          </p>

          {(branding.location || branding.coordinator_name) ? (
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-100">
              {branding.location ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 backdrop-blur-sm">
                  <MapPin size={16} aria-hidden="true" /> {branding.location}
                </span>
              ) : null}
              {branding.coordinator_name ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 backdrop-blur-sm">
                  <Users size={16} aria-hidden="true" /> Coordenação: {branding.coordinator_name}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {hasCoordinator ? (
          <aside className="relative hidden min-h-[270px] lg:block" aria-label="Coordenação do polo">
            <div className="absolute inset-6 rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${withAlpha(primary, '38') ?? '#ff7a0038'} 0%, ${withAlpha(accent, '12') ?? '#00d4ff12'} 45%, transparent 72%)` }} />
            {branding.teacher_photo ? (
              <div className="absolute inset-0 overflow-hidden rounded-[28px]">
                <Image
                  src={branding.teacher_photo}
                  alt={branding.coordinator_name ?? 'Coordenação do polo'}
                  fill
                  priority
                  unoptimized
                  className="object-cover object-center"
                  style={{
                    maskImage: 'linear-gradient(90deg, transparent 0%, black 18%, black 100%)',
                    WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 18%, black 100%)',
                  }}
                />
              </div>
            ) : null}
            {branding.coordinator_name ? (
              <div className="absolute bottom-4 right-4 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-right backdrop-blur-md">
                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Coordenação</span>
                <strong className="mt-1 block text-base text-white">{branding.coordinator_name}</strong>
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>

      {branding.footer_credit ? (
        <div className="relative z-10 border-t border-white/10 px-6 py-4 text-xs text-slate-500 md:px-8 lg:px-10">
          {branding.footer_credit}
        </div>
      ) : null}
    </section>
  )
}
