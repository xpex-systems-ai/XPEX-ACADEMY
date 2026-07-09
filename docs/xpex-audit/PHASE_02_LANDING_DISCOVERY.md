# Fase 02 — Descoberta da landing pública XpeX Academy

## Roteamento identificado

O frontend em `apps/web` usa **Next.js App Router**. A estrutura pública e interna fica em `apps/web/app`, com `layout.tsx` na raiz, rotas segmentadas por diretórios e páginas `page.tsx`.

Não foi encontrada uma implementação ativa em `apps/web/pages`, e a aplicação já possui rotas sensíveis como `app/auth`, `app/admin`, `app/home`, `app/orgs`, `app/api`, `app/embed`, `app/payments` e áreas internas agrupadas em `(hub)`.

## Arquivos públicos encontrados

- `apps/web/app/layout.tsx` — layout global com providers, fontes e scripts runtime.
- `apps/web/app/home/page.tsx` e `apps/web/app/home/home.tsx` — hub autenticado; redireciona usuários não autenticados para `/login`.
- `apps/web/app/auth/login/page.tsx`, `apps/web/app/auth/signup/page.tsx`, `apps/web/app/auth/forgot/page.tsx`, `apps/web/app/auth/reset/page.tsx` — fluxos de autenticação existentes.
- `apps/web/app/admin/login/page.tsx` — login administrativo.
- `apps/web/app/api/*` — rotas API do Next.js que não devem ser alteradas nesta fase.
- `apps/web/components/Landings` — diretório existente e seguro para componentes de landing/marketing.
- `apps/web/public/*` — assets públicos do projeto base LearnHouse.

## Rota alterada ou criada

Foi criada a rota pública raiz `/` em `apps/web/app/page.tsx`, renderizando a landing premium da XpeX Academy.

A escolha foi segura porque não havia `apps/web/app/page.tsx` previamente, enquanto `/home` é explicitamente autenticada e acoplada à escolha de organizações. Assim, a landing pública passa a existir sem substituir os fluxos internos de login, hub, admin, organizações, API, pagamentos ou colaboração.

## Riscos encontrados

- A rota `/home` é sensível ao estado de sessão e não deve virar página institucional.
- O projeto possui muitas rotas internas e providers globais; por isso a landing foi implementada como página visual sem alterar autenticação, banco, permissões, pagamentos ou API.
- O formulário de lista de espera não tem backend seguro nesta fase; por isso foi criado apenas como formulário visual com TODO explícito.
- Há alterações pré-existentes no `apps/web/pnpm-lock.yaml` não relacionadas à landing; elas foram preservadas e não fazem parte da implementação visual.

## Por que a abordagem é segura

- A implementação usa App Router no local nativo `apps/web/app/page.tsx`.
- A landing é uma página estática de apresentação e não importa lógica de sessão, banco, API, pagamentos ou integrações externas.
- Componentes e constantes foram adicionados em diretórios de frontend (`components/Landings` e `lib`) sem modificar rotas internas do LearnHouse.
- A atribuição técnica ao LearnHouse e a licença AGPL-3.0 foram preservadas no rodapé e na documentação.
