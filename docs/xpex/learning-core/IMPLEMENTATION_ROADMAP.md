# Implementation Roadmap — Learning Core

| Ordem | Missão | Objetivo | Dependências | Critérios de aceite | Risco | Rollback |
|---|---|---|---|---|---|---|
| 1 | MISSION-006 | Definir preset de permissões e checklist operacional do piloto | ADR-002, Role.rights | Matriz aprovada, sem código crítico alterado | Permissão excessiva | Reverter docs/configuração |
| 2 | MISSION-007 | Configurar piloto com Organization + UserGroup + Course em ambiente controlado | MISSION-006 | Sem dados pessoais reais; curso privado; turma ligada | Exposição indevida | Remover vínculos de grupo/recurso |
| 3 | MISSION-008 | Validar progress/enrollment com TrailRun/TrailStep | Curso piloto | Fluxo aluno documentado e testado com dados fictícios | Progresso inconsistente | Remover dados fictícios |
| 4 | MISSION-009 | Formalizar certificado de curso livre | Política de wording | Certificado só emite com critérios e texto aprovados | Compliance | Desabilitar certificação do curso |
| 5 | MISSION-010 | Dashboard mínimo da professora | Analytics/trail/submissions | Professora vê progresso/submissions sem admin amplo | Privacidade | Desativar permissão/dashboard |
| 6 | MISSION-011 | Decidir presença/portfólio | Feedback piloto | ADR para construir ou adiar | Escopo grande | Manter controle externo temporário |

## Próxima missão recomendada

MISSION-006 deve ser documental/operacional: fechar `Role.rights` de professora/operador, checklist de publicação privada e política de certificado antes de configurar dados reais.
