# ADR-007 — Execução Beta-first

- **Status:** Aceito
- **Data:** A confirmar
- **Decisão:** DL-BETA-001 a DL-BETA-005

## Contexto

O histórico recente criou preparação, controles e auditorias para staging avançado. A prioridade oficial atual é validar aprendizagem e operação com a meta de 10 alunos fundadores no Polo Kelle Digital Lab. Integração de artefatos de staging não equivale a deploy Google Cloud.

## Decisão

Adotar execução **Beta-first**: pessoas, currículo, conteúdo, vídeos, projetos, professor, feedback e plataforma mínima antecedem nova expansão de infraestrutura. GitHub e Vercel formam a rota inicial. Novas missões Google Cloud ficam pausadas até uso real ou necessidade comprovada; código, workflows e documentação existentes são preservados.

As missões atuais usam `XPEX-BETA-NNN`, sem renumerar `MISSION-NNN` histórico. O [Mission Ledger](../beta-operation/MISSION_LEDGER.md) é a fonte operacional vigente.

## Consequências

### Positivas

- Prioridade inequívoca e orientada à aprendizagem.
- Menor risco de custo e complexidade prematuros.
- IDs sem colisão e continuidade auditável.

### Trade-offs

- Capacidades avançadas podem permanecer ociosas enquanto a necessidade não for comprovada.
- Vercel isoladamente não substitui serviços persistentes da plataforma completa.
- Retomar Google Cloud exigirá nova decisão, evidência e missão autorizada.

## Não decisões

Este ADR não executa deploy, não cria recursos cloud, não remove staging, não matricula alunos e não afirma que a meta da turma já foi alcançada.
