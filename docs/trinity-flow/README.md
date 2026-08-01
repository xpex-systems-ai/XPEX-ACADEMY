# XpeX Trinity Flow™

Este diretório reúne a governança operacional oficial da XpeX Academy para planejar, executar, auditar, corrigir, versionar, aprovar, implantar e validar missões no repositório.

## Documentos

- [Manifesto](MANIFESTO.md): visão, papéis, princípios e lema do Trinity Flow.
- [Protocolo de execução](EXECUTION_PROTOCOL.md): procedimento operacional completo da missão à validação pós-merge.
- [Checklist de Pull Request](PR_REVIEW_CHECKLIST.md): itens obrigatórios antes de merge.
- [Template de missão](MODULE_EXECUTION_TEMPLATE.json): estrutura reutilizável para próximas missões.
- [Template de ADR](ARCHITECTURE_DECISION_TEMPLATE.md): registro padronizado de decisões arquiteturais.

## Sequência oficial de execução

1. Architect define blueprint, escopo, restrições e critérios de aceite.
2. Researcher pesquisa documentação oficial quando houver incerteza técnica.
3. Builder cria branch por missão e executa somente o escopo autorizado.
4. Builder valida, commita e abre Pull Request revisável.
5. Architect e/ou revisores auditam a PR por severidade P0, P1, P2 e P3.
6. Builder corrige achados na mesma PR.
7. Operador registra aprovação humana.
8. Merge é realizado somente após aprovação.
9. Deploy e validação pós-merge são registrados.

## Histórico técnico integrado

Esta seção registra o histórico `MISSION-NNN`; ela não define a fila atual da Operação Beta. Integração de preparação, planos ou controles de staging **não comprova deploy em Google Cloud**.

| Missão | Status | Observação |
|--------|--------|------------|
| MISSION-001 | Concluída | Fundação, auditoria e rebranding seguro inicial. |
| MISSION-002 | Concluída | Landing pública e estabilizações relacionadas. |
| MISSION-003 — Trinity Governance Foundation | Concluída | Governança integrada na PR #7. |
| MISSION-004 — Kelle Pilot Architecture | Concluída | Documentação arquitetural do piloto Kelle Digital Lab criada em [docs/xpex/kelle-pilot](../xpex/kelle-pilot/README.md). |
| MISSION-005 — Learning Core Blueprint | Concluída | Blueprint oficial do Learning Core criado em [docs/xpex/learning-core](../xpex/learning-core/README.md). |
| MISSION-006 — Kelle Pilot Configuration Blueprint | Concluída | Blueprint operacional documental criado em [docs/xpex/kelle-pilot/configuration](../xpex/kelle-pilot/configuration/README.md). |
| MISSION-007 — Kelle Teacher Role Policy Validator | Concluída | Validador dry-run e política candidata em [docs/xpex/kelle-pilot/role-validation](../xpex/kelle-pilot/role-validation/README.md). |
| MISSION-008 — Platform Core Capability Registry | Concluída | Registro oficial de capacidades do Platform Core criado em [docs/xpex/platform-core](../xpex/platform-core/README.md). |
| MISSION-009 — Environment and Deployment Readiness Audit | Concluída | Auditoria de readiness registrada em [docs/xpex/deployment-readiness](../xpex/deployment-readiness/README.md), sem deploy ou mutação de provedor. |
| MISSION-010 — API Container Port and Bind Hardening | Concluída | Hardening funcional do container API para `PORT` > `LEARNHOUSE_PORT` > `9000`, bind `0.0.0.0` e health check alinhado. |
| MISSION-011 — Staging Configuration Matrix | Concluída | Matriz documental integrada na PR #15 em [docs/xpex/staging-configuration](../xpex/staging-configuration/README.md), sem valores reais ou mutação de provedor. |
| Trabalho integrado nas PRs #16–#18 | Concluído | Correções de configuração e preparação de backend/staging; não constitui evidência de deploy GCP. |
| Trabalho integrado nas PRs #19–#24 | Concluído | Auditorias, readiness, runbooks, pacote controlado e workflow manual com gates; não constitui evidência de deploy GCP. |
| Trabalho integrado nas PRs #25–#28 | Concluído | Controles e auditorias de execução plan-only/modo plan; não constitui evidência de deploy GCP. |

## Operação Beta atual

As próximas missões usam o namespace `XPEX-BETA-NNN`, separado do histórico acima. A fonte de verdade operacional é o [Mission Ledger da Operação Beta](../xpex/beta-operation/MISSION_LEDGER.md). `XPEX-BETA-001` está em execução documental e `XPEX-BETA-002` é a próxima missão proposta.

Novas expansões Google Cloud estão pausadas, não abandonadas. Os artefatos técnicos existentes permanecem preservados e só devem voltar à fila mediante uso real ou necessidade comprovada e decisão registrada.

## Regras centrais

- Uma missão por branch.
- Sem mudanças funcionais fora do escopo.
- Sem secrets no repositório.
- Sem alterações críticas sem autorização explícita.
- Licença AGPL-3.0, atribuições LearnHouse e compatibilidade upstream devem ser preservadas.
- Toda missão deve terminar em Pull Request revisável e aprovação humana antes de merge.
