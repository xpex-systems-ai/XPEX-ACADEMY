# Fase 01 — Fundação XpeX Academy: Auditoria Técnica Inicial

## Resumo do estado atual do fork

O repositório é um fork baseado no LearnHouse, organizado como monorepo com frontend, backend, colaboração em tempo real, CLI, documentação e empacotamento Docker. A base já contém recursos avançados de LMS, incluindo cursos, organizações, autenticação, analytics, IA, certificados, editor, conteúdo, webhooks e infraestrutura self-hosted.

A Fase 01 aplicou apenas rebranding seguro em documentação, configuração padrão e mensagem raiz da API. Não foram alteradas regras de autenticação, pagamentos, banco de dados, permissões, migrações ou módulos críticos.

## Arquitetura identificada

| Área | Caminho | Observações |
|------|---------|-------------|
| Web | `apps/web` | Next.js/React, app router, locales, serviços frontend, Sentry, PostHog proxy e build standalone. |
| API | `apps/api` | FastAPI, config YAML/env, routers, serviços, testes, Alembic, SQLModel e integrações. |
| Collab | `apps/collab` | Servidor colaborativo com Bun/Node, Hocuspocus/Yjs. |
| CLI | `apps/cli` | CLI `learnhouse` para setup, dev, start, stop, update, backup, logs e doctor. |
| Docker | `Dockerfile` | Imagem multi-stage que constrói web, API e collab em um runtime final. |
| Nginx | `docker/nginx.conf` | Proxy para frontend, API, auth, content, docs em dev e collab websocket. |
| Docs | `docs` | Documentação LearnHouse existente e nova documentação XpeX. |

## Pontos de rebranding encontrados

A busca textual encontrou ocorrências de `LearnHouse`, `learnhouse`, `learnhouse.app`, `hi@learnhouse.app`, `Welcome to LearnHouse`, slogan institucional original e descrições originais em várias áreas:

- `README.md` com título, imagem, slogan, links, segurança, comunidade e atribuições do LearnHouse.
- `apps/api/config/config.yaml` com `site_name`, `site_description` e `contact_email` padrão.
- `apps/api/app.py` com mensagem raiz `Welcome to LearnHouse ✨`.
- `apps/cli/README.md`, `apps/cli/package.json`, scripts e testes com referências técnicas ao pacote CLI `learnhouse`.
- `docker/start.sh` com nomes de processos PM2 `learnhouse-web`, `learnhouse-api` e `learnhouse-collab`.
- `apps/web/package.json` com nome do pacote `learnhouse`.
- `docs/` com documentação técnica original do LearnHouse.
- `apps/api/src` e `apps/web` com textos, serviços, traduções e nomes técnicos internos.

## Decisões de rebranding seguro

Alterado nesta fase:

- README principal para apresentar XpeX Academy como produto construído sobre LearnHouse.
- Configuração padrão `site_name`, `site_description` e `contact_email`.
- Mensagem raiz da API.
- Documentação XpeX estratégica, deploy, roadmap e manifesto.
- Exemplo de ambiente sem secrets reais.

Preservado nesta fase:

- Nome técnico do pacote CLI `learnhouse`.
- Nomes técnicos de containers, processos, imports, funções e variáveis `LEARNHOUSE_*`.
- Documentação upstream necessária para operação e compatibilidade.
- Licença AGPL-3.0 e atribuições ao LearnHouse.

## Riscos de deploy

- Deploy completo exige PostgreSQL, Redis e storage persistente.
- Vercel é adequada para landing/frontend demonstrativo, mas não substitui a operação full-stack persistente.
- Build pode falhar se variáveis obrigatórias, dependências, versões de runtime ou serviços externos não estiverem disponíveis.
- Configurações de domínio/cookies/CORS devem ser revisadas antes de produção.
- JWT secret precisa ser forte, único e definido fora do Git.
- E-mail, IA, pagamentos, S3 e Sentry dependem de provedores e secrets externos.

## Variáveis de ambiente críticas

- `LEARNHOUSE_SITE_NAME`
- `LEARNHOUSE_SITE_DESCRIPTION`
- `LEARNHOUSE_CONTACT_EMAIL`
- `LEARNHOUSE_ENV`
- `LEARNHOUSE_DEVELOPMENT_MODE`
- `LEARNHOUSE_TENANCY`
- `LEARNHOUSE_AUTH_JWT_SECRET_KEY`
- `LEARNHOUSE_SQL_CONNECTION_STRING`
- `LEARNHOUSE_REDIS_CONNECTION_STRING`
- `LEARNHOUSE_IS_AI_ENABLED`
- `LEARNHOUSE_AI_PROVIDER`
- `LEARNHOUSE_AI_API_KEY`
- `LEARNHOUSE_GEMINI_API_KEY`
- `LEARNHOUSE_EMAIL_PROVIDER`
- `LEARNHOUSE_SYSTEM_EMAIL_ADDRESS`

## Plano recomendado

### MVP visual em Vercel

Usar Vercel para landing institucional, páginas públicas, validação de copy e captação. Evitar prometer plataforma completa sem backend persistente.

### Plataforma completa em Docker/Railway/VPS

Usar Docker/Railway/Render/Fly.io/VPS com PostgreSQL, Redis, storage, domínio, e-mail, JWT secret, backups, logs e monitoramento.

## Descoberta de branding/constants/frontend

Foram encontrados pontos de branding distribuídos em configuração backend, documentação, translations, SEO/metadata e configurações de organização. Não foi aplicado um rebrand visual profundo no frontend nesta fase porque há muitos textos técnicos e internos ligados à compatibilidade LearnHouse. A criação de constantes `XPEX_ACADEMY_BRAND` e a substituição visual pública devem ficar para a Fase 02, após mapear rotas públicas, i18n/locales e componentes de landing.

## Próximas fases sugeridas

1. Criar landing institucional XpeX Academy.
2. Mapear rotas públicas e componentes visuais do frontend.
3. Criar camada central de branding sem quebrar i18n, org branding ou compatibilidade upstream.
4. Validar deploy full-stack com banco, Redis, domínio e e-mail.
5. Planejar Global Skills Hub e Trilhas XpeX como módulos incrementais.
