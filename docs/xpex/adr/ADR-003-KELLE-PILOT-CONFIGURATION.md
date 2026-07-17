# ADR-003 — Kelle Pilot Configuration Blueprint

## Status

Proposto.

## Contexto

MISSION-006 exige definir a configuração operacional exata do primeiro piloto **Kelle Digital Lab** antes de criar organização, usuários, turma, curso, dados reais, seeds ou alterações funcionais. O piloto deve ser tratado como **curso livre** e **projeto educacional independente**.

## Problema

Como configurar o primeiro piloto usando apenas capacidades existentes, reduzindo ambiguidade operacional, risco de exposição pública, privilégio excessivo da professora e emissão indevida de certificado?

## Opções consideradas

### Opção A — Blueprint documental com entidades existentes

Documentar Organization, Role, UserGroup, Course, Chapter, Activity, Assignment, TrailRun/TrailStep e Certifications/CertificateUser, com checklists e exemplos não executáveis.

**Prós:** sem risco funcional; preserva compatibilidade; permite revisão humana antes de dados reais.

**Contras:** ainda exige missão futura para validação operacional.

### Opção B — Criar dados piloto agora

Criar organização, turma, curso e papéis diretamente.

**Prós:** acelera demonstração.

**Contras:** viola o escopo; aumenta risco de dados reais, publicação indevida e permissões amplas.

### Opção C — Criar abstrações novas de cohort/metodologia/certificado

Adicionar modelos específicos para Kelle/NAVE IA.

**Prós:** modelagem sob medida.

**Contras:** prematuro; exige migrations e API; duplica capacidades existentes.

## Decisão

Adotar a **Opção A**. A configuração oficial do primeiro piloto será um blueprint documental versionado em `docs/xpex/kelle-pilot/configuration/`.

Decisões principais:

- Kelle Digital Lab será configurado futuramente como `Organization` com slug reservado `kelle-digital-lab`.
- Turma Piloto 01 será `UserGroup`, com membros por `UserGroupUser` e recursos por `UserGroupResource`.
- O curso `Informática Básica com Inteligência Artificial` iniciará `public=false`, `published=false` e `open_to_contributors=false`.
- NAVE IA será representado por `Chapter` e `extra_metadata`, sem novo modelo de banco.
- Conteúdo da turma deve usar locks `restricted` e publicação gradual.
- A professora deve usar custom role de menor privilégio; Maintainer é amplo demais para operação inicial.
- Certificado deve ser curso livre, projeto educacional independente, sem claims acadêmicos externos.

## Consequências

- Nenhum dado real é criado nesta missão.
- A próxima missão funcional pode validar apenas a role candidata, com rollback simples.
- A operação ganha checklists de publicação, acesso, certificado e rollback.
- Permanecem lacunas de presença, portfólio formal, governança de IA e validação de dashboard por turma.

## Riscos

- O schema de `Role.rights` não possui bucket dedicado para `certifications`; serviços dependem do acesso ao curso.
- Admin/Maintainer bypassam locks restritos em serviços de curso, então o papel da professora precisa ser validado.
- `Certifications.config` é JSON livre; wording inadequado só é evitado por governança e aprovação humana.

## Plano de reversão

Como a decisão é documental, reversão significa remover este ADR e os documentos de configuração. Se uma futura validação provar que `UserGroup` ou `TrailStep` não atende ao piloto, criar ADR específica para cohort/enrollment/presença preservando `org_id`, Course e CertificateUser quando possível.

## Próxima missão recomendada

**MISSION-007 — Kelle Pilot Role Matrix Validation**: validar a custom role da professora em ambiente controlado, sem dados reais de alunos e sem criar curso/turma produtivos. Rollback: remover role candidata e manter operador/admin como único configurador.
