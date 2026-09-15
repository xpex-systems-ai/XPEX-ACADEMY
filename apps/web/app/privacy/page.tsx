import type { Metadata } from 'next'
import { XpexLegalPage } from '@/components/Legal/XpexLegalPage'

export const metadata: Metadata = { title: 'Política de Privacidade — Kelle Digital Lab' }

export default function PrivacyPage() {
  return <XpexLegalPage eyebrow="Privacidade e proteção" title="Política de Privacidade" summary="Como os dados necessários ao funcionamento educacional e administrativo são utilizados e protegidos na Kelle Digital Lab.">
    <section><h2>1. Dados tratados</h2><p>Podemos tratar dados cadastrais, informações de acesso, matrículas, progresso acadêmico, interações com conteúdos e registros técnicos necessários à segurança e ao funcionamento da plataforma.</p></section>
    <section><h2>2. Finalidades</h2><p>Os dados são utilizados para autenticação, prestação do serviço educacional, gestão de cursos e turmas, suporte, segurança, prevenção de fraude e cumprimento de obrigações legais.</p></section>
    <section><h2>3. Compartilhamento</h2><p>O acesso aos dados é limitado a pessoas e fornecedores necessários à operação, sob obrigações de segurança e confidencialidade. Não comercializamos dados pessoais.</p></section>
    <section><h2>4. Segurança e retenção</h2><p>Aplicamos controles técnicos e organizacionais proporcionais ao risco. Os dados são mantidos pelo período necessário às finalidades informadas e às obrigações legais aplicáveis.</p></section>
    <section><h2>5. Direitos do titular</h2><p>Nos termos da LGPD, o titular pode solicitar confirmação, acesso, correção e demais direitos aplicáveis pelo canal oficial informado pela administração do Polo.</p></section>
    <section><h2>6. Atualizações</h2><p>Esta política poderá ser atualizada conforme a evolução da plataforma ou da legislação. A versão vigente estará sempre disponível neste endereço.</p><p className="mt-3 text-xs text-slate-500">Versão publicada em 15 de setembro de 2026.</p></section>
  </XpexLegalPage>
}
