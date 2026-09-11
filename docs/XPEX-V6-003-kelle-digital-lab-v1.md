# XPEX-V6-003 — Kelle Digital Lab V1

## Objetivo

Elevar o Polo para uma identidade premium multi-polo, mantendo o contrato persistido introduzido na V6-002 e sem hardcode da Kelle no código autenticado.

## Implementado

- Hero institucional premium dirigido somente por `PoloBranding` persistido.
- Foto da coordenadora, logo, localização, tagline e nome exibidos somente quando existem no branding persistido.
- Tema do shell do Polo recebe cores persistidas sem alterar o ramo Super Admin.
- Sidebar do Polo passa a renderizar logo/nome da organização quando disponíveis.
- Governança Vercel generalizada para permitir previews auditados `feat/xpex-v6-*`, mantendo projetos duplicados em quarentena fora desse padrão.
- Teste estático V6-003 garante ausência de hardcode Kelle na camada autenticada e preservação do caminho Super Admin.

## Bloqueios deliberados

- `teacher_photo`: BLOCKED_ASSET. O handoff mestre registra que o asset oficial da Professora Kelle ainda não está disponível como fonte técnica confiável. Nenhuma imagem gerada ou material de marketing será promovido como foto oficial.
- `teacher_assigned`: BLOCKED_IDENTITY. O vínculo real de professora deve usar uma identidade já existente e autorizada no Learning Core. Nenhuma conta, e-mail, papel ou membership será inventado ou alterado por inferência.
- Valores reais de `location`, `coordinator_name`, `tagline`, `footer_credit` e cores devem ser gravados em `OrganizationConfig` por fluxo autorizado; esta missão não faz migration nem escrita direta em banco.

## Política de dados

REAL_DATA_ONLY. Ausência de dado permanece ausência. Não criar KPI, avaliação, data de fundação, telefone, endereço ou vínculo pedagógico fictício.

## Escopo preservado

- Super Admin: intocado em comportamento e rotas.
- Learning Core: sem alteração.
- Banco/migrations: sem alteração.
- Railway/env/secrets: sem alteração.
- Vídeo/provider/pagamentos: fora do escopo.

## Gate

A PR desta missão pode ser validada por CI e preview. O release visual completo da Kelle exige asset oficial e persistência da identidade real no `OrganizationConfig`.
