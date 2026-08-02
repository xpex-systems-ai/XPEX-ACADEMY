# XPEX-BETA-005A — auditoria do repositório

Data: 2026-08-02  
Base verificada: `dev` / `5a5668f99ca512dcdf2f4382aee776d8cf0c6fc6`

## Escopo e método

Foram inventariados `apps/web/app`, `components` (incluindo Dashboard, Objects, Editor/AI, Landings e Contexts), `services`, `lib`, `public`, `proxy.ts` e os routers/serviços do FastAPI. `apps/api/src/models` e `apps/api/src/repositories` não existem nesta revisão; a persistência está encapsulada na arquitetura atual da API. Nenhum arquivo protegido precisa ser alterado.

## Arquitetura encontrada

- O App Router mantém as superfícies públicas, autenticação, administração, hub e rotas tenant-scoped em `app/orgs/[orgslug]`.
- `proxy.ts` resolve tenancy single/multi e custom domains. `lib/proxyPaths.ts` já isenta `/beta` e `/beta/*` do rewrite; portanto não há defeito de roteamento a corrigir.
- O shell administrativo existente (`Dashboard/Menus/DashLeftMenu.tsx` e `DashMobileMenu.tsx`) está acoplado a organização, sessão e permissões. Não deve ser reutilizado diretamente na demonstração pública.
- Cursos, capítulos, atividades, assignments e certificados possuem serviços dedicados em `services/courses`; progresso é apresentado nos componentes de curso e analytics. Comunidades, playgrounds, boards, podcasts e biblioteca também possuem superfícies próprias.
- Autenticação é fornecida por `Contexts/AuthContext.tsx`, `LHSessionContext.tsx`, interceptador e `services/auth`; organização por `OrgContext.tsx` e `services/organizations`.
- O editor Tiptap está em `Objects/Editor`, com assistência em `Objects/Editor/AI/AIEditorSidePanel.tsx` e `AIEditorToolkit.tsx`; a API mantém geração, RAG, quiz, cenário, assignment, áudio e planejamento com abstração de LLM.
- Feature metadata e limites aparecem em `services/features`, `services/plans`, `services/orgs/usage` e billing guards. A Beta não deve contornar nem consumir essas regras.
- Há muitos assets LearnHouse em `public`; não foi localizada fotografia autorizada da professora nem pacote oficial XpeX. A apresentação deve usar marca tipográfica e avatar neutro.

## Matriz LearnHouse → XpeX

| capacidade | caminho atual | estado | manter | adaptar | substituir visualmente | criar | risco | missão futura |
|---|---|---|---|---|---|---|---|---|
| Autenticação | `services/auth`, `Contexts/AuthContext.tsx`, `app/auth` | funcional | sim | não | depois | não | alto | integração autenticada |
| Organizações/tenants | `OrgContext.tsx`, `services/organizations`, `proxy.ts` | funcional | sim | polos depois | depois | não | alto | polo como organização |
| Shell administrativo | `components/Dashboard/Menus` | funcional/acoplado | sim | não nesta missão | sim, apenas Beta | shell Beta | médio | temas por tenant |
| Cursos e capítulos | `services/courses`, páginas `orgs/*/course*` | funcional | sim | expor | sim | cards preview | médio | conectar catálogo |
| Atividades e assignments | `services/courses/activities.ts`, `assignments.ts` | funcional | sim | nomear Projetos | sim | lista preview | médio | projetos reais |
| Progresso | curso, contextos e analytics | funcional | sim | conectar após auth | sim | barras preview | médio | progresso real |
| Analytics | `Dashboard/Analytics`, API `analytics` | amplo | sim | visão professora/polo | sim | métricas preview | médio | dashboards conectados |
| Certificados | `services/courses/certifications.ts` e rotas | funcional | sim | marca depois | sim | card preview | baixo | emissão conectada |
| Comunidade | `Objects/Communities`, services/API | funcional | sim | renomear | sim | chamada preview | médio | Comunidade XpeX |
| Editor | `Objects/Editor` | avançado | sim | marca depois | depois | não | alto | XpeX Studio |
| Editor IA | `Objects/Editor/AI`, `Contexts/AI` | funcional | sim | adaptar | depois | não | alto | Professor IA |
| IA backend | `apps/api/src/services/ai` | provider-neutral | sim | orquestrar depois | não | não | alto | GXEON Intelligence Layer |
| Playgrounds/código/boards | services, pages e Dashboard | funcional | sim | expor depois | depois | não | médio | Laboratório IA |
| Planos/pagamentos | `services/plans`, `billing`, `payments` | funcional/configurável | sim | não | não | não | alto | fora do Beta |
| Landing XpeX | `Landings/XpexAcademy` | preview inicial | sim | sim | sim | seções premium | baixo | publicação gradual |
| Beta aluno/professora | `components/Beta/BetaShell.tsx` | fictícia | migrar | sim | sim | experiências | baixo | conexão após auth |
| Beta polo | inexistente | ausente | n/a | n/a | n/a | sim | baixo | organização real |

## Plano exato da implementação

1. Criar tokens, tipos, dados demonstrativos, primitives e shell em `components/Xpex`.
2. Manter os entrypoints Server Components e trocar `BetaShell` por dashboards compostos reutilizáveis.
3. Criar `/beta/polo` sem chamadas de rede.
4. Evoluir a landing existente com a paleta oficial laranja/azul e CTAs explícitos para as três visões.
5. Documentar tokens, responsividade, acessibilidade e regras de claims.
6. Adicionar testes estáticos das rotas e dos rótulos de transparência.

## Riscos e limites

- A demonstração é deliberadamente isolada de sessão e backend; qualquer conexão prematura criaria risco de autorização e claims incorretos.
- O shell LearnHouse real permanece com sua identidade para evitar regressões amplas. Rebranding tenant-scoped deve ser incremental.
- Sem imagens oficiais anexadas, não serão inventados retratos, logos de parceiros ou números operacionais.
- O catálogo e métricas são conceitos visuais, sempre marcados como dados fictícios.
