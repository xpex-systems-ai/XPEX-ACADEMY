# Fase 03 — Auditoria de build e proxy da XpeX Academy

## Escopo

Esta fase estabiliza a entrega pública da landing premium da XpeX Academy em `/`, preservando as rotas internas do LearnHouse e evitando dependência obrigatória de Google Fonts durante o build do `apps/web`.

## Auditoria do proxy

- `apps/web/proxy.ts` resolvia tenancy antes das regras de roteamento e possuía um bloco histórico para apex root em modo multi-tenant.
- Esse fluxo podia reescrever `/` para `/auth/login` ou `/home` em hosts apex multi-tenant, impedindo a landing institucional pública de aparecer.
- A correção adiciona um bypass explícito e documentado para `pathname === '/'`, retornando `NextResponse.next()` para o App Router renderizar `apps/web/app/page.tsx`.
- Cookies de instância continuam sendo definidos na resposta para preservar contexto de tenancy sem forçar rewrite de organização.

## Rotas preservadas

- `/` é a landing pública oficial da XpeX Academy.
- `/home` continua sendo o hub autenticado/org picker.
- `/login` e `/signup` continuam usando o fluxo de autenticação existente.
- `/admin` continua roteando para o painel administrativo.
- `/orgs`, `/api`, `/payments`, `/embed`, `/board` e `/editor` não tiveram lógica crítica alterada.

## Correção de fonte para build

- O import de `next/font/google` foi removido do layout global.
- A variável CSS `--font-default` agora usa stack local/sistema: `Inter`, `ui-sans-serif`, `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI` e `sans-serif`.
- Nenhum arquivo de fonte proprietário foi adicionado.
- O build deixa de depender de fetch externo para baixar `Wix_Madefor_Text`.

## Landing health check

- `XpexAcademyLanding` permanece como Server Component.
- Não há uso de `window`, `document` ou `localStorage` na landing.
- Os CTAs são links/âncoras estáticos, sem handlers client obrigatórios.
- Imports de `lucide-react` e `next/link` permanecem compatíveis com renderização server-side.

## Resultado dos checks

- `pnpm install` executado em `apps/web`.
- ESLint dos arquivos-alvo passou.
- `pnpm build` confirmou que o erro de `@codemirror/language` foi removido após adicionar a dependência; a execução posterior compilou com sucesso, mas foi encerrada por timeout local durante a etapa TypeScript.
- ESLint completo (`pnpm lint`) foi iniciado, mas precisou ser encerrado por timeout local; o ESLint dos arquivos-alvo passou com apenas um warning preexistente de `console.warn` no proxy.
- `pnpm test || true` executou a suíte disponível com 25 testes passando.

## Dependências

- `@codemirror/language` foi adicionada apenas após o build confirmar erro `Module not found: Can't resolve '@codemirror/language'`.
- A versão segue CodeMirror 6; `pnpm install --offline` vinculou o pacote já presente no lock/cache do app após o registry npm retornar 403 para o `pnpm add` online.

## Produção / preview

Para validar manualmente:

1. `cd apps/web && pnpm dev`
2. Abrir `http://localhost:3000/` e confirmar a landing XpeX Academy.
3. Abrir `http://localhost:3000/login` e confirmar o fluxo de login.
4. Abrir `http://localhost:3000/home` e confirmar que o hub autenticado não foi substituído pela landing.
5. Abrir `http://localhost:3000/admin` e confirmar que o admin continua roteando corretamente.

## Fora de escopo preservado

Esta fase não altera banco de dados, migrações, autenticação, pagamentos, permissões, APIs críticas, Collab Server ou integrações reais de IA, jobs, freelas, marketplace e lista de espera.
