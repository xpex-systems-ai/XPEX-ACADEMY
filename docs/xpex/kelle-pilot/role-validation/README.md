# MISSION-007 — Kelle Teacher Role Policy Validator

## Objetivo

A MISSION-007 transforma a matriz documental da professora do piloto Kelle Digital Lab em uma política candidata validável por código antes de qualquer criação de role organizacional. O validador é genérico, reutilizável e executa em dry-run sem banco, rede, token, organização real ou usuário real.

## Arquitetura

- `apps/api/src/security/role_policy_validator.py` contém uma função pura (`validate_role_policy`) que recebe um `dict` carregado de JSON e retorna resultado estruturado.
- O schema de buckets e ações é introspectado a partir de `Rights`, `Permission`, `PermissionsWithOwn` e `DashboardPermission` em `apps/api/src/db/roles.py`.
- `apps/api/scripts/validate_role_policy.py` é um comando local de dry-run que imprime JSON e usa código de saída `0` para política válida e `1` para inválida.
- `config/role-policies/kelle-pilot-teacher.json` é uma política candidata versionada; não contém `org_id`, `user_id`, e-mail, token, endpoint privado ou dados pessoais reais.

## Formato da política

A entrada aceita pelo validador deve conter:

- `metadata`: identificação, versão, escopo, status candidato, `contains_real_data=false` e `deny_by_default=true`.
- `role`: nome descritivo, descrição e `rights` no mesmo formato semântico de `Role.rights`.
- `constraints`: buckets negados e concessões proibidas para a política educacional inicial.

## Como executar dry-run

```bash
python apps/api/scripts/validate_role_policy.py config/role-policies/kelle-pilot-teacher.json
```

Interpretação do resultado:

- `valid`: `true` somente quando não há erros, buckets desconhecidos, ações desconhecidas, tipo inválido ou concessões proibidas.
- `errors`: mensagens humanas para bloquear a política candidata.
- `warnings`: alertas não bloqueantes, como buckets omitidos que ficam negados por `deny_by_default`.
- `unknown_buckets`: buckets não existentes no schema atual de `Rights`.
- `unknown_actions`: ações incompatíveis com o tipo do bucket.
- `forbidden_grants`: permissões booleanas `true` bloqueadas pela política do piloto.
- `summary`: resumo para humanos e agentes, incluindo grants `true` e buckets omitidos negados.

## Matriz candidata aprovada

A política candidata permite acesso mínimo para dashboard, leitura de cursos/turma/usuários, atualização própria de curso atribuído e atualização de chapters, activities e assignments para fluxo educacional e avaliação. Ela nega criação, deleção, administração de organização, administração de roles, lifecycle de usuários e lifecycle de turmas.

## Casos inválidos testados

A suíte cobre buckets desconhecidos, ações desconhecidas, valores não booleanos, `organizations.action_update=true`, `roles.action_create=true`, qualquer delete inicial, ação `own` em bucket comum, ação errada em dashboard, bucket omitido com deny-by-default e política estilo Maintainer.

## Limitações e segurança

- A política permanece candidata e não é automaticamente conectada ao fluxo produtivo de criação de roles.
- Nenhuma role real foi criada.
- Nenhum usuário, organização, turma, curso ou dado pessoal real foi criado.
- Nenhuma migration, seed, autenticação, sessão ou comportamento de RBAC produtivo foi alterado.
- O validador prova coerência estrutural e restrições de menor privilégio; aprovação operacional ainda exige revisão humana e missão futura.

## Notas técnicas do fluxo atual de criação de roles

`RoleCreate` recebe `name`, `description`, `rights` e `org_id`. O serviço real de criação valida `org_id`, força `RoleTypeEnum.TYPE_ORGANIZATION` para roles criadas por usuários, verifica organização existente, exige permissão `roles.action_create`, valida estrutura parcial de rights e persiste somente após essas etapas. Esta missão não altera esse fluxo e não chama o serviço de criação.

## Rollback

Reverter o commit da missão remove o módulo, o script, a política candidata, os testes e esta documentação. O impacto esperado em runtime e dados é nulo porque o validador não está acoplado ao fluxo produtivo e não escreve no banco.

## Próxima missão recomendada

MISSION-008 deve executar validação operacional controlada da política aprovada, ainda sem dados pessoais reais, antes de associar qualquer professora, usuário ou organização produtiva.
