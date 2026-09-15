import type { Metadata } from 'next'
import Link from 'next/link'
import { XpexLegalPage } from '@/components/Legal/XpexLegalPage'

export const metadata: Metadata = { title: 'Termos de Serviço — Kelle Digital Lab' }

export default function TermsPage() {
  return <XpexLegalPage eyebrow="Documento oficial" title="Termos de Serviço" summary="Condições essenciais para utilizar os ambientes educacionais da Kelle Digital Lab com tecnologia XPeX Academy AI.">
    <section><h2>1. Uso da plataforma</h2><p>O acesso é destinado a usuários autorizados. Cada pessoa é responsável por manter suas credenciais protegidas e por utilizar os recursos exclusivamente para finalidades educacionais e administrativas legítimas.</p></section>
    <section><h2>2. Conteúdos e conduta</h2><p>Não é permitido publicar material ilícito, violar direitos de terceiros, tentar acessar áreas sem autorização ou interferir na segurança e disponibilidade do serviço.</p></section>
    <section><h2>3. Disponibilidade</h2><p>A plataforma pode receber atualizações, manutenção e melhorias. Sempre que possível, mudanças relevantes serão comunicadas pelos canais oficiais da organização.</p></section>
    <section><h2>4. Propriedade intelectual</h2><p>Conteúdos próprios, marcas e materiais institucionais permanecem protegidos por seus respectivos direitos. Componentes de software livre mantêm as licenças e atribuições indicadas na plataforma.</p></section>
    <section><h2>5. Privacidade</h2><p>O tratamento de dados pessoais segue a <Link href="/privacy">Política de Privacidade</Link> e a legislação aplicável, incluindo a Lei Geral de Proteção de Dados.</p></section>
    <section><h2>6. Atualizações e contato</h2><p>Estes termos podem ser atualizados para refletir mudanças legais ou operacionais. Dúvidas devem ser encaminhadas ao canal oficial informado pela administração do Polo.</p><p className="mt-3 text-xs text-slate-500">Versão publicada em 15 de setembro de 2026.</p></section>
  </XpexLegalPage>
}
