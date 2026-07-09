# Fase 03 — Auditoria de build e proxy

## Correção Fase 03.1 — Landing pública no apex sem quebrar tenants

A rota raiz `/` agora mantém a landing institucional da XpeX Academy apenas quando a requisição chega pelo domínio raiz/apex/default da plataforma ou por `localhost` durante desenvolvimento.

Para evitar sequestro de organizações, o proxy resolve o tenant antes de liberar o bypass público. Se o resolvedor indicar `subdomain` ou `custom-domain`, a requisição não renderiza a landing global e continua no fluxo tenant-scoped existente, que reescreve para `/orgs/{slug}/`.

## Regra validada

- Apex/root/default: `/` passa direto para `apps/web/app/page.tsx`.
- Localhost: `/` passa direto para a landing para desenvolvimento local.
- Subdomínio de organização: `/` permanece tenant-scoped.
- Custom domain de organização: `/` permanece tenant-scoped.
- Rotas internas preservadas: `/home`, `/login`, `/signup`, `/admin`, `/api`, `/payments`, `/embed`, `/board` e `/editor` não foram convertidas em landing pública.

## Escopo preservado

A correção alterou somente o roteamento do proxy e documentação. Não houve alteração em banco de dados, migrações, autenticação, pagamentos, permissões, Collab Server, fonte local/sistema, dependências CodeMirror ou secrets.
