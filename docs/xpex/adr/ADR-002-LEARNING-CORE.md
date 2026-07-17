# ADR-002 — Estratégia oficial do Learning Core

## Status

Proposto.

## Contexto

A XpeX Academy é um fork estratégico do LearnHouse. O repositório já contém cursos, capítulos, atividades, assignments, submissions, trilhas/progresso, certificados, user groups, organizações, papéis, RBAC, analytics e media. MISSION-005 autoriza apenas descoberta e documentação.

## Problema

Como consolidar uma base de aprendizagem reutilizável para Kelle Digital Lab e futuros cursos sem duplicar Platform Core, criar schema prematuro ou ampliar risco multi-tenant?

## Opções consideradas

### Opção A — Learning Core como camada sobre entidades existentes

Reutilizar Course, Chapter, Activity, Assignment, TrailRun/TrailStep, Certifications e UserGroup com limites claros contra Platform Core.

### Opção B — Criar entidades XpeX específicas agora

Criar novas tabelas para turma, matrícula, progresso, certificado e presença.

### Opção C — Tratar cada piloto como customização isolada

Implementar fluxos específicos por cliente/polo.

## Decisão recomendada

Adotar a **Opção A**. O Learning Core é a camada de produto e governança que orquestra entidades LearnHouse existentes. Novas entidades só entram após lacuna comprovada por missão e ADR própria.

## O que reutilizar

- Organization, User, UserOrganization, Role/RBAC.
- UserGroup, UserGroupUser e UserGroupResource.
- Course, Chapter, Activity, Assignment e Submission.
- Trail, TrailRun e TrailStep.
- Certifications e CertificateUser.
- Analytics, media/storage e notifications quando aplicáveis.

## O que nunca duplicar

- Autenticação, sessão, usuários, organizações, papéis, permissões, billing, storage, observabilidade, proxy multi-tenant e migrations existentes.
- Enrollment/progresso/certificado paralelos sem ADR e justificativa.

## Limites Platform Core x Learning Core

Platform Core fornece identidade, isolamento, direitos, infraestrutura, storage, billing e observabilidade. Learning Core define estrutura curricular, jornada do aluno, fluxo da professora, progresso pedagógico, assignments e certificação de aprendizagem.

## Consequências

- Menor risco e maior compatibilidade upstream.
- O MVP pode começar com Organization + UserGroup + Course.
- Lacunas como presença, cohort formal, portfólio e revogação de certificado permanecem explícitas.
- Permissões precisam ser refinadas antes de operação real.

## Riscos

- Confundir UserGroup com cohort completo.
- Conceder permissões amplas a professoras.
- Emitir certificados com wording inadequado.
- Depender de analytics sem validar cobertura de eventos.

## Plano de reversão

Como esta ADR é documental, reversão é remover ou substituir os documentos. Se uma futura implementação provar que UserGroup/TrailRun não bastam, criar ADR para introduzir Cohort/Enrollment formal e migrar preservando `org_id`, Course e CertificateUser.

## Questões abertas

- Qual é o preset final de `Role.rights` para professora?
- Quais critérios exatos geram certificado no Kelle Digital Lab?
- Presença será externa no MVP ou integrada?
- Analytics atuais serão suficientes para acompanhamento de turma?
