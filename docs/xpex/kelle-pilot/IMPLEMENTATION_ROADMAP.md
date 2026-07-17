# Roadmap de implementação em missões pequenas

| Ordem | Missão sugerida | Objetivo | Dependências | Critérios de aceite | Risco | Rollback |
|---|---|---|---|---|---|---|
| 1 | MISSION-006 — Pilot Configuration Blueprint | Definir configuração exata de organização, turma, curso, papéis e certificado sem dados reais | MISSION-004 e MISSION-005 | Blueprint revisado, sem código funcional | Baixo | Reverter docs/config exemplos |
| 2 | MISSION-007 — Role Matrix Validation | Validar política candidata da professora com dry-run sem banco antes de criar qualquer role | MISSION-006 | Validador reutilizável, política candidata aprovada e testes negativos | Médio | Reverter módulo, política, testes e docs |
| 3 | MISSION-008 — Course Structure Draft | Criar estrutura curricular controlada para curso livre | MISSION-006 | Chapters/activities definidos em ambiente não produtivo ou documentação de import | Médio | Remover draft |
| 4 | MISSION-009 — Certificate Wording | Configurar template/política de certificado de curso livre | MISSION-006 | Texto aprovado sem vínculo acadêmico | Médio | Desabilitar emissão/template |
| 5 | MISSION-010 — AI Guardrails | Definir habilitação de RAG/copilot, créditos e limites | MISSION-006 | IA isolada por org/curso e política aceita | Alto | Desabilitar flags de IA |
| 6 | MISSION-011 — Attendance Decision | Decidir se presença exige módulo próprio | Piloto em operação | ADR/escopo de produto | Médio | Manter controle externo temporário |
| 7 | MISSION-012 — Portfolio MVP | Consolidar evidências de assignments/submissions | Curso com atividades | MVP sem nova exposição indevida | Médio | Desativar interface/feature |

## Recomendação objetiva para MISSION-007

Executar a validação dry-run da política candidata da professora sem dados pessoais reais e sem criação de role, curso ou turma produtivos. A missão deve confirmar dashboard mínimo, leitura de turma/submissions e ausência de permissões de billing, roles administrativas, organizações externas e exclusão ampla.
