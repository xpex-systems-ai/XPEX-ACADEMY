import type { Metadata } from 'next'
import { XpexAcademyLanding } from '@components/Landings/XpexAcademy/XpexAcademyLanding'

export const metadata: Metadata = {
  title: 'XpeX Academy — Aprendizagem, Criação e Inteligência Artificial',
  description: 'Conheça o ecossistema XpeX Academy para aprender, praticar, desenvolver projetos e evoluir com apoio humano e inteligência artificial.',
}

export default function PublicLandingPage() {
  return <XpexAcademyLanding />
}
