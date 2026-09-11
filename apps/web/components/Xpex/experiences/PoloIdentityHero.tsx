import Image from 'next/image'
import { ImageOff, MapPin, Sparkles, UserRound } from 'lucide-react'
import type { PoloBranding } from '@/lib/xpex/polo-branding'

const withAlpha = (hex: string | undefined, alpha: string) => {
  if (!hex || !/^#[\da-f]{6}$/i.test(hex)) return undefined
  return `${hex}${alpha}`
}

function BrandMark({ branding }: { branding: PoloBranding }) {
  const monogram = branding.organization_name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'PO'
  return <div className="xpex-polo-logo-slot">
    {branding.logo ? <Image src={branding.logo} alt={`Logomarca ${branding.organization_name}`} fill unoptimized className="object-contain p-2"/> : <span aria-label="Logomarca aguardando configuração">{monogram}</span>}
  </div>
}

export function PoloIdentityHero({ branding }: { branding: PoloBranding }) {
  const primary = branding.primary_color ?? '#ff7a00'
  const accent = branding.accent_color ?? '#00d4ff'
  const background = branding.background ?? '#07111f'

  return <section className="xpex-polo-hero" style={{ borderColor: withAlpha(accent, '45'), background: `radial-gradient(circle at 83% 18%, ${withAlpha(accent, '17') ?? '#00d4ff17'}, transparent 26%), radial-gradient(circle at 18% 88%, ${withAlpha(primary, '1F') ?? '#ff7a001f'}, transparent 34%), linear-gradient(135deg, ${background}, #071522 58%, #08111a)` }} aria-label={`Identidade do polo ${branding.organization_name}`}>
    <div aria-hidden="true" className="xpex-polo-hero-grid" />
    <div className="xpex-polo-hero-content">
      <div className="xpex-polo-hero-copy">
        <div className="xpex-polo-brand-lockup"><BrandMark branding={branding}/><div><p className="xpex-label">Polo educacional</p><p className="xpex-polo-brand-name">{branding.organization_name}</p></div></div>
        <p className="xpex-label mt-8">Visão geral</p>
        <h1>{branding.organization_name}</h1>
        <p className="xpex-polo-hero-tagline">{branding.tagline ?? 'Acompanhe a operação da sua organização com informações autorizadas.'}</p>
        <div className="xpex-polo-identity">
          {branding.location ? <span><MapPin size={15} aria-hidden="true"/>{branding.location}</span> : null}
          {branding.coordinator_name ? <span><UserRound size={15} aria-hidden="true"/>{branding.coordinator_name}</span> : null}
        </div>
      </div>
      <aside className="xpex-teacher-photo-slot" aria-label="Espaço para foto oficial da responsável pelo polo">
        {branding.teacher_photo ? <Image src={branding.teacher_photo} alt={branding.coordinator_name ?? 'Responsável pelo polo'} fill priority unoptimized className="object-cover object-center"/> : <div className="xpex-teacher-photo-placeholder"><ImageOff aria-hidden="true" size={28}/><span>Foto da professora</span></div>}
        <div className="xpex-teacher-photo-overlay" />
        <div className="xpex-teacher-photo-caption"><Sparkles aria-hidden="true" size={15} style={{ color: accent }}/><span>{branding.coordinator_name ?? 'Responsável pelo polo'}</span></div>
      </aside>
    </div>
    {branding.footer_credit ? <p className="xpex-polo-hero-credit">{branding.footer_credit}</p> : null}
  </section>
}
