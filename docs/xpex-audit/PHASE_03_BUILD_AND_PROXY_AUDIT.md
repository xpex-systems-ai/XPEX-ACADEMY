# Fase 03 — Auditoria de build e proxy

## Correção Fase 03.2 — Gate seguro da landing e build offline

A rota raiz `/` agora libera a landing institucional da XpeX Academy somente quando a requisição chega por `localhost` ou por um host apex explicitamente configurado na instância (`frontend_domain` ou `top_domain`). O proxy normaliza protocolo, path, porta, caixa e ponto final antes de comparar os hosts.

Essa regra substitui o gate amplo baseado em `resolved.source === 'default'`. Em tenancy `single`, o resolvedor continua retornando o tenant `default`, mas isso não é mais suficiente para abrir a landing global. Se o host atual não for localhost nem o apex configurado, a requisição cai no rewrite tenant-scoped existente para `/orgs/default/`, preservando instalações self-host/single-tenancy.

## Regra validada

- Localhost: `/` passa direto para `apps/web/app/page.tsx` para desenvolvimento local.
- Apex configurado (`frontend_domain` ou `top_domain`): `/` passa direto para `apps/web/app/page.tsx`.
- Host não configurado em single-tenancy/self-host: `/` permanece tenant-scoped e reescreve para `/orgs/default/`.
- Subdomínio de organização: `/` permanece tenant-scoped.
- Custom domain de organização: `/` permanece tenant-scoped.
- Rotas internas preservadas: `/home`, `/login`, `/signup`, `/admin`, `/api`, `/payments`, `/embed`, `/board` e `/editor` não foram convertidas em landing pública.

## Consolidação de build

A dependência obrigatória de `next/font/google` foi removida do layout raiz para evitar falhas de build em ambientes offline, restritos ou sem fetch externo para Google Fonts. O frontend agora usa uma stack local/sistema por CSS, mantendo `Inter` como primeira opção quando disponível no ambiente do usuário.

A dependência direta `@codemirror/language` foi adicionada ao app web porque o lockfile já registrava o pacote como parte do grafo CodeMirror 6 e o build pode falhar quando imports transitivos deixam de expor esse módulo diretamente.

## Escopo preservado

A correção alterou somente o proxy do frontend, layout/CSS de fonte, dependência CodeMirror do app web e documentação. Não houve alteração em banco de dados, migrações, autenticação, pagamentos, permissões, API, Collab Server ou secrets.
