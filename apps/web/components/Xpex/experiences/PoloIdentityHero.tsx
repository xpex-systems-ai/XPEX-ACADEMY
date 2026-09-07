import { MapPin, Sparkles, Users } from 'lucide-react'
import { XpexRoleHero } from '../XpexPrimitives'

export function PoloIdentityHero({ title }: { title: string }) {
  return <XpexRoleHero eyebrow="XPeX Academy · Polo XPeX" title={title} description="Educação que inspira, tecnologia que transforma."><div className="xpex-polo-identity"><span><Sparkles size={15}/> Polo Premium XPeX Academy</span><span><MapPin size={15}/> Planaltina DF, Brasil</span><span><Users size={15}/> Coordenação: Professora Kelle</span></div></XpexRoleHero>
}
