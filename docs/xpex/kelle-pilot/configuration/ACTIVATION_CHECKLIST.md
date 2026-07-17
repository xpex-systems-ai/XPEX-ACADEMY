# Activation Checklist — futura missão funcional

> Checklist reversível e auditável. Não executar nesta missão documental.

## Pré-ativação

- [ ] PR da MISSION-006 aprovada e mergeada.
- [ ] Dados reais autorizados por missão separada.
- [ ] Slug, e-mail, textos, imagens e disclaimer aprovados.
- [ ] Matriz de role da professora validada.
- [ ] Política LGPD/dados pessoais validada.

## Sequência operacional proposta

1. Criar Organization Kelle Digital Lab com `explore=false`.
2. Criar custom role da professora com menor privilégio.
3. Associar operador e professora à organização.
4. Criar UserGroup `Turma Piloto 01`.
5. Criar Course privado com `public=false`, `published=false`, `open_to_contributors=false`.
6. Criar Chapters NAVE IA e Activities com `lock_type=restricted`.
7. Criar Activities e Assignments com `published=false` quando o recurso possuir esse campo.
8. Vincular recursos ao UserGroup por `UserGroupResource`.
9. Validar vínculos de `UserGroupResource`, `org_id` e pertencimento da turma.
10. Alterar `published=true` somente em ambiente controlado e manter `public=false`.
11. Adicionar alunos autorizados ao UserGroup.
12. Testar aluno dentro da turma.
13. Testar usuário autenticado fora da turma.
14. Testar acesso anônimo bloqueado.
15. Configurar certificado somente após wording aprovado.

## Rollback

- Despublicar assignments e activities.
- Remover `UserGroupResource` dos recursos restritos.
- Remover membros do `UserGroupUser` se necessário.
- Voltar `Course.published=false` e `public=false`.
- Desabilitar/remover configuração de certificação antes de emissão real.
- Registrar incidentes e evidências.

## Primeira missão funcional recomendada

**MISSION-007 — Kelle Pilot Role Matrix Validation**: validar, em ambiente controlado, a custom role de professora sem criar curso/turma com dados reais. Escopo: criar/avaliar payload de role em ambiente não produtivo, testar dashboard mínimo e confirmar ausência de billing, roles, organizações externas e delete de conteúdo. Rollback: remover role candidata.
