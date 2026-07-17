# Kelle Digital Lab — arquitetura do piloto

## Visão geral

MISSION-004 documenta como o piloto **Kelle Digital Lab** pode ser representado na arquitetura existente da XpeX Academy, fork estratégico do LearnHouse, sem criar telas, rotas, modelos, migrations ou dados reais.

O piloto deve ser tratado como **curso livre** e **projeto educacional independente**. Esta documentação não usa nome, logotipo, identidade visual ou vínculo oficial com faculdade ou universidade.

## Escopo

- Descoberta arquitetural baseada no código real.
- Mapeamento de capacidades existentes: organização, usuários, papéis, grupos, cursos, capítulos, atividades, assignments, progresso, certificados, comunidades, analytics e IA.
- Registro de lacunas para implementação futura controlada.
- Recomendação de arquitetura reutilizando entidades existentes.

## Status

| Item | Estado |
|---|---|
| Código funcional | Não alterado |
| Modelos/migrations | Não alterados |
| Rotas/componentes | Não criados |
| Dados reais | Não adicionados |
| Recomendação arquitetural | Kelle Digital Lab como organização/tenant existente, com turma piloto como user group |

## Documentos

- [Inventário de capacidades](CAPABILITY_INVENTORY.md)
- [Mapeamento de entidades](ENTITY_MAPPING.md)
- [Papéis e permissões](ROLES_AND_PERMISSIONS.md)
- [Jornadas de usuário](USER_JOURNEYS.md)
- [Análise de lacunas](GAP_ANALYSIS.md)
- [Roadmap de implementação](IMPLEMENTATION_ROADMAP.md)
- [ADR-001 — Kelle Pilot Architecture](../adr/ADR-001-KELLE-PILOT-ARCHITECTURE.md)

## Restrições de marca

- Usar o nome **Kelle Digital Lab**.
- Declarar **Projeto educacional independente** quando o piloto for apresentado publicamente.
- Classificar o primeiro curso como **curso livre**.
- Não prometer emprego, renda, reconhecimento acadêmico, certificação universitária, preço ou quantidade de alunos sem fonte oficial.

## Próximas missões

A MISSION-005 recomendada é uma missão funcional pequena para configurar o MVP do piloto usando capacidades existentes: organização, responsável, user group de turma, curso inicial privado/publicável, trilha/estrutura curricular e política de certificado de curso livre, ainda sem dados pessoais reais.
