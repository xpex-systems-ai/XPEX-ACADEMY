# ADR-001 — Estratégia de representação do Kelle Digital Lab

## Status

Recomendado para MISSION-004.

## Contexto

A XpeX Academy é um fork estratégico do LearnHouse. O piloto Kelle Digital Lab será um projeto educacional independente de curso livre. A missão exige descoberta e documentação sem criar arquitetura paralela, telas, rotas, modelos, migrations, seeds ou dados reais.

O repositório já possui organização/tenant, associação usuário-organização, papéis/RBAC, user groups, cursos, capítulos, atividades, assignments, progresso por trail, certificados, comunidades, analytics e módulos de IA/RAG.

## Problema

Como representar o primeiro piloto real sem duplicar capacidades existentes e sem ampliar riscos de multi-tenancy, marca, permissões ou certificação indevida?

## Opções consideradas

### Opção A — Kelle Digital Lab como organização existente

Usar `Organization` como tenant lógico, turma como `UserGroup`, curso como `Course`, módulos como `Chapter`, aulas como `Activity`, tarefas como `Assignment`, progresso como `TrailRun/TrailStep` e certificado como `Certifications/CertificateUser`.

**Prós:** reutiliza isolamento por `org_id`, RBAC, curso, grupos e certificados existentes; evita schema novo; reversível.

**Contras:** turma/cohort, presença e portfólio formal não são entidades dedicadas.

### Opção B — Kelle Digital Lab como configuração interna da organização XpeX

Manter tudo dentro de uma organização geral XpeX e segmentar por tags/metadados.

**Prós:** menor configuração inicial.

**Contras:** risco maior de exposição cruzada, menor clareza operacional, pior aderência ao isolamento multi-tenant.

### Opção C — Criar novas entidades de polo/cohort/presença/portfólio agora

Criar arquitetura específica para o piloto.

**Prós:** modelagem sob medida.

**Contras:** viola intenção de evitar implementação prematura, aumenta risco e cria dívida antes de validar o piloto.

## Decisão recomendada

Adotar a **Opção A**: representar Kelle Digital Lab como uma **organização/tenant existente**. A turma piloto deve ser um **user group** dentro da organização. O primeiro curso deve ser um `Course` de curso livre, estruturado em `Chapter` e `Activity`, com `Assignment` para práticas, `TrailRun/TrailStep` para progresso e `Certifications/CertificateUser` para certificado de curso livre.

O Método NAVE IA deve começar como estrutura curricular documentada e metadados em curso/capítulos/atividades, não como novo modelo de banco.

## Consequências

- Evita novas tabelas, endpoints e componentes no MVP arquitetural.
- Preserva isolamento por organização e compatibilidade LearnHouse.
- Exige cuidado com role da professora para aplicar menor privilégio.
- Mantém presença e portfólio consolidado como lacunas explícitas.
- Certificados só podem ser usados com wording de curso livre e projeto educacional independente.

## Riscos

- Customização insuficiente de RBAC pode conceder acesso amplo demais.
- User group pode não cobrir todos os requisitos pedagógicos de turma/cohort.
- Analytics existentes podem não entregar relatórios de presença/portfólio.
- IA/RAG pode gerar custo ou exposição se habilitada sem governança.

## Plano de reversão

Se a representação como organização/user group não atender ao piloto, criar ADR futura para introduzir entidade formal de cohort/turma. A reversão deve preservar dados por `org_id`, migrar associações de user group para a nova entidade e manter certificados/curso como recursos existentes sempre que possível.

## Questões ainda abertas

- Qual matriz final de `rights` representa a professora com menor privilégio?
- Haverá presença obrigatória no MVP ou controle externo temporário?
- Quais critérios exatos geram certificado de curso livre?
- IA/RAG será habilitada na primeira turma ou somente após governança específica?
