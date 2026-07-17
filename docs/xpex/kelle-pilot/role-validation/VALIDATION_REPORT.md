# MISSION-007 — Validation Report

## Resultado da política candidata

A política `kelle-pilot-teacher` versão `1.0.0` permanece válida no dry-run projetado do validador e não contém concessões proibidas. A política está marcada como `candidate`, `scope=organization`, `contains_real_data=false` e `deny_by_default=true`.

## Correção da auditoria GX da PR #11

- Buckets presentes em `role.rights` agora precisam declarar todas as ações exigidas pelo schema do bucket.
- `Permission` exige `action_create`, `action_read`, `action_update` e `action_delete`.
- `PermissionsWithOwn` exige `action_create`, `action_read`, `action_read_own`, `action_update`, `action_update_own`, `action_delete` e `action_delete_own`.
- `DashboardPermission` exige `action_access`.
- Buckets inteiros omitidos continuam permitidos somente como deny-by-default, sem concessão implícita.
- A constraint wildcard `bucket="*"` agora é suportada explicitamente para ações proibidas globais; no JSON candidato ela documenta e reforça bloqueio global de `action_delete` e `action_delete_own`.

## Regras aplicadas

- Buckets precisam existir no schema atual de `Rights`.
- Ações precisam pertencer ao tipo do bucket (`Permission`, `PermissionsWithOwn` ou `DashboardPermission`).
- Todos os buckets presentes precisam estar completos para seu tipo de permissão.
- Valores de ações precisam ser booleanos.
- Buckets omitidos são negados por padrão quando `deny_by_default=true`.
- Permissões de delete e delete_own são proibidas na política inicial.
- Criação, atualização e deleção de `organizations`, `roles`, `users` e `usergroups` são bloqueadas conforme a matriz do piloto.
- Buckets fora do MVP inicial permanecem negados.

## Casos automatizados

- Política candidata válida.
- Bucket desconhecido `billing`.
- Ação desconhecida `action_manage`.
- Valor não booleano em `action_read`.
- Atualização de organização habilitada.
- Criação de role habilitada.
- Delete habilitado em `activities`.
- Ação `action_read_own` em bucket `users`.
- Ação `action_read` em `dashboard`.
- Bucket omitido negado por padrão.
- Política similar a Maintainer com múltiplas concessões proibidas.
- `users` contendo somente `action_read` falha por ações ausentes.
- `courses` sem `action_delete_own` falha por ação ausente.
- `dashboard` sem `action_access` falha por ação ausente.
- Bucket completo válido passa mesmo quando outros buckets inteiros são omitidos por deny-by-default.
- Verificação de ausência de mutação do input.

## Comandos executados nesta correção

| Comando | Resultado |
|---|---|
| `python -m json.tool config/role-policies/kelle-pilot-teacher.json` | Sucesso; JSON sintaticamente válido. |
| `pytest apps/api/src/tests/security/test_role_policy_validator.py` | Falha ambiental; ambiente local não possui dependências Python do projeto (`ModuleNotFoundError: No module named 'sqlalchemy'` ao carregar `conftest.py`). |
| `python apps/api/scripts/validate_role_policy.py config/role-policies/kelle-pilot-teacher.json` | Falha ambiental por ausência de `pydantic`; nenhuma escrita em banco ou chamada de rede foi iniciada. |
| `python apps/api/scripts/validate_role_policy.py /tmp/invalid-role-policy-*.json` | Exit code `1`, porém falha ambiental antes da validação estruturada por ausência de `pydantic`; a política inválida temporária foi criada localmente e removida. |
| `python -m py_compile apps/api/src/security/role_policy_validator.py apps/api/scripts/validate_role_policy.py apps/api/src/tests/security/test_role_policy_validator.py` | Sucesso; arquivos Python sem erro sintático. |
| `git diff --check` | Sucesso; sem whitespace errors. |

## Quantidade de testes

A suíte específica contém 17 testes unitários declarados para o validador. A execução real de pytest não completou neste container por falta das dependências Python do projeto (`sqlalchemy` no carregamento do `conftest.py`). A validação sintática dos arquivos Python passou.

## Confirmações de escopo

- Nenhuma role real foi criada.
- Nenhum dado pessoal foi adicionado.
- Nenhuma migration foi criada.
- Nenhum seed existente foi alterado.
- Nenhum endpoint, autenticação, sessão ou comportamento produtivo de RBAC foi alterado.
- Nenhum frontend foi alterado.
- O validador e o dry-run não contêm código de escrita em banco nem chamadas de rede.

## Limitações ambientais restantes

Este container não possui o ambiente Python completo do projeto. As tentativas anteriores de instalar dependências foram bloqueadas por acesso ao índice de pacotes, e `uv run` não encontrou o Python exigido pelo `pyproject.toml` (`>=3.14.3,<3.14.4`). Portanto, a suíte deve ser reexecutada em um ambiente de API provisionado com as dependências do projeto.
