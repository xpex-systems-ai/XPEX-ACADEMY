import type { Metadata } from 'next'
import { XpexAcademyLanding } from '@components/Landings/XpexAcademy/XpexAcademyLanding'

export const metadata: Metadata = {
  title: 'XpeX Academy — Plataforma Global de Desenvolvimento Profissional com IA',
  description: 'Aprenda habilidades reais, pratique com projetos, construa seu portfólio e evolua com orientação inteligente.',
}

export default function PublicLandingPage() {
  return <XpexAcademyLanding />
}
