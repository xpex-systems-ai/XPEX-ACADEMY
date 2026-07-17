# XpeX Learning Core — Blueprint oficial

## Visão geral

MISSION-005 consolida o **Learning Core** da XpeX Academy como camada de aprendizagem reutilizável sobre o fork LearnHouse. O objetivo é orientar Kelle Digital Lab, futuros polos, clientes, cursos livres e trilhas sem duplicar o Platform Core.

## Escopo

Inclui cursos, capítulos, atividades, assignments, submissions, progresso, certificados, jornadas de aprendizagem e fluxos de professora/instrutor. Exclui autenticação, usuários, organizações, papéis, billing, storage, observabilidade e infraestrutura, que permanecem no Platform Core.

## Status

| Item | Estado |
|---|---|
| Código funcional | Não alterado |
| Modelos/migrations/endpoints/componentes | Não criados |
| Dados reais/seeds | Não adicionados |
| Dependências/lockfiles | Não alterados |
| Decisão arquitetural | Proposta em ADR-002 |

## Relação com Platform Core

O Learning Core deve **consumir** Organization, User, UserOrganization, Role/Rights, RBAC, storage, billing e observabilidade existentes. Ele não deve criar abstrações paralelas de tenant, conta, sessão, permissão, pagamento, arquivo ou log.

## Relação com Kelle Digital Lab

O Kelle Digital Lab continua recomendado como `Organization` existente, turma como `UserGroup`, curso livre como `Course`, módulos como `Chapter`, aulas como `Activity`, práticas como `Assignment`, progresso como `TrailRun/TrailStep` e certificado como `Certifications/CertificateUser`, conforme ADR-001.

## Documentos

- [Inventário de capacidades](CAPABILITY_INVENTORY.md)
- [Relações entre entidades](ENTITY_RELATIONSHIP.md)
- [Ciclo de vida do curso](COURSE_LIFECYCLE.md)
- [Jornada do aluno](STUDENT_JOURNEY.md)
- [Jornada da professora/instrutor](TEACHER_JOURNEY.md)
- [Fluxo de certificação](CERTIFICATION_FLOW.md)
- [Matriz de permissões](PERMISSIONS_MATRIX.md)
- [Análise de lacunas](GAP_ANALYSIS.md)
- [Roadmap de implementação](IMPLEMENTATION_ROADMAP.md)
- [ADR-002 — Learning Core](../adr/ADR-002-LEARNING-CORE.md)

## Próximas missões

A próxima missão recomendada é MISSION-006: configurar o MVP documental-operacional do piloto usando somente entidades existentes, começando por matriz de direitos de professora e política de acesso/certificado antes de qualquer carga real.
