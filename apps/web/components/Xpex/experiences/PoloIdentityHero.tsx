import { MapPin, Sparkles, Users } from 'lucide-react'
import { XpexRoleHero } from '../XpexPrimitives'

const normalizeTenantName = (value: string) => value.trim().toLocaleLowerCase('pt-BR')

export function PoloIdentityHero({ title }: { title: string }) {
  const isKelleDigitalLab = normalizeTenantName(title) === 'kelle digital lab'

  return (
    <XpexRoleHero
      eyebrow="XPeX Academy · Polo XPeX"
      title={title}
      description="Educação que inspira, tecnologia que transforma."
    >
      <div className="xpex-polo-identity">
        <span><Sparkles size={15}/> Polo Premium XPeX Academy</span>
        {isKelleDigitalLab ? <span><MapPin size={15}/> Planaltina DF, Brasil</span> : null}
        {isKelleDigitalLab ? <span><Users size={15}/> Coordenação: Professora Kelle</span> : null}
      </div>
    </XpexRoleHero>
  )
}
