# Diagnóstico de prontidão do ambiente

Execute `cd apps/api && uv run python cli.py xpex-pilot-readiness`. O relatório imprime somente o **nome** e um estado permitido (`ready`, `missing` ou `invalid` nesta verificação de configuração); nunca imprime valores. Para verificação completa ainda é necessário testar API, banco, Redis, revisão das migrações e associações do piloto no ambiente-alvo.

## Serviços e variáveis

- Segurança: `LEARNHOUSE_AUTH_JWT_SECRET_KEY`.
- PostgreSQL: `LEARNHOUSE_SQL_CONNECTION_STRING`.
- Redis: `LEARNHOUSE_REDIS_CONNECTION_STRING`.
- Plataforma: `LEARNHOUSE_SITE_NAME`, `LEARNHOUSE_SITE_DESCRIPTION`, `LEARNHOUSE_ENV`, `LEARNHOUSE_DEVELOPMENT_MODE`, `LEARNHOUSE_TENANCY`.
- E-mail transacional: `LEARNHOUSE_EMAIL_PROVIDER`, `LEARNHOUSE_SYSTEM_EMAIL_ADDRESS`.
- Web/API: a URL da API deve ser configurada pelo runtime config existente do frontend.
- IA opcional: `LEARNHOUSE_IS_AI_ENABLED`, `LEARNHOUSE_AI_PROVIDER`, `LEARNHOUSE_AI_API_KEY`.
- Bootstrap temporário: `ALLOW_PILOT_BOOTSTRAP` e `XPEX_PILOT_{ADMIN,TEACHER,STUDENT}_{USERNAME,EMAIL,PASSWORD}`.

O diagnóstico cobre cada um desses dez nomes de bootstrap individualmente. Ausência/whitespace retorna `missing`; gate ou ambiente não permitido retorna `invalid`. O comando de bootstrap usa a mesma lista e recusa configuração incompleta com erro controlado, sem `KeyError` e sem imprimir valores.

`XPEX_PILOT_READINESS` é o estado agregado: somente retorna `ready` quando todos os nomes obrigatórios estão válidos; retorna `pending` se algum estiver ausente e `invalid` se qualquer valor configurado falhar na validação.

Valores secretos pertencem exclusivamente aos secret stores dos provedores. Nunca registre JWT, senha, hash, URL SQL/Redis completa ou token. Armazenamento persistente/S3 é requisito de prontidão para conteúdo, mas não é provisionado nesta missão.

## Estado operacional esperado

Antes do primeiro login real: API alcançável; PostgreSQL e Redis alcançáveis; `uv run alembic current` igual ao head; JWT e tenancy válidos; frontend apontando à API; e-mail pronto; organização e as três associações de teste presentes. Estados de falha devem ser tratados como `missing`, `invalid`, `unreachable` ou `pending`, nunca mascarados como prontos.

O workflow API Tests autentica o upload de cobertura por GitHub OIDC (`id-token: write`), sem segredo no repositório. Falha externa do Codecov continua bloqueante porque `fail_ci_if_error` permanece habilitado e deve ser distinguida do resultado da etapa pytest.
