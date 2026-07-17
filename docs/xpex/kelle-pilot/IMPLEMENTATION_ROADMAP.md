# Roadmap de implementação em missões pequenas

| Ordem | Missão sugerida | Objetivo | Dependências | Critérios de aceite | Risco | Rollback |
|---|---|---|---|---|---|---|
| 1 | MISSION-005 — Pilot Configuration Blueprint | Definir configuração exata de organização, turma, curso, papéis e certificado sem dados reais | MISSION-004 | Blueprint revisado, sem código funcional | Baixo | Reverter docs/config exemplos |
| 2 | MISSION-006 — Role Matrix Validation | Validar/ajustar custom role da professora em ambiente controlado | MISSION-005 | Matriz de direitos aprovada, sem privilégio excessivo | Médio | Remover role customizada |
| 3 | MISSION-007 — Course Structure Draft | Criar estrutura curricular controlada para curso livre | MISSION-005 | Chapters/activities definidos em ambiente não produtivo ou documentação de import | Médio | Remover draft |
| 4 | MISSION-008 — Certificate Wording | Configurar template/política de certificado de curso livre | MISSION-005 | Texto aprovado sem vínculo acadêmico | Médio | Desabilitar emissão/template |
| 5 | MISSION-009 — AI Guardrails | Definir habilitação de RAG/copilot, créditos e limites | MISSION-005 | IA isolada por org/curso e política aceita | Alto | Desabilitar flags de IA |
| 6 | MISSION-010 — Attendance Decision | Decidir se presença exige módulo próprio | Piloto em operação | ADR/escopo de produto | Médio | Manter controle externo temporário |
| 7 | MISSION-011 — Portfolio MVP | Consolidar evidências de assignments/submissions | Curso com atividades | MVP sem nova exposição indevida | Médio | Desativar interface/feature |

## Recomendação objetiva para MISSION-005

Preparar um blueprint operacional versionado para configurar o primeiro MVP sem implementação funcional ampla: organização Kelle Digital Lab, turma como user group, papel mínimo da professora, curso livre inicial, critérios de certificado e checklist de segurança/marca.
