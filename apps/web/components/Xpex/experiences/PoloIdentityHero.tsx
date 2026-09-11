import Image from 'next/image'
import { MapPin, Users } from 'lucide-react'
import type { PoloBranding } from '@/lib/xpex/polo-branding'
import { XpexRoleHero } from '../XpexPrimitives'

export function PoloIdentityHero({ branding }: { branding: PoloBranding }) {
  return <section style={{ backgroundColor: branding.background, borderColor: branding.accent_color }}>
    {branding.hero_image && <Image src={branding.hero_image} alt="" width={1200} height={320} unoptimized className="w-full rounded-2xl object-cover"/>}
    <XpexRoleHero
      eyebrow="Visão institucional"
      title={branding.organization_name}
      description={branding.tagline ?? 'Acompanhe sua organização e as ferramentas autorizadas para sua conta.'}
    >
      <div className="xpex-polo-identity" style={{ color: branding.primary_color }}>
        {branding.logo && <Image src={branding.logo} alt={branding.organization_name} width={64} height={64} unoptimized/>}
        {branding.teacher_photo && <Image src={branding.teacher_photo} alt={branding.coordinator_name ?? 'Coordenação'} width={64} height={64} unoptimized/>}
        {branding.location && <span><MapPin size={15}/>{branding.location}</span>}
        {branding.coordinator_name && <span><Users size={15}/>Coordenação: {branding.coordinator_name}</span>}
      </div>
    </XpexRoleHero>
  </section>
}
