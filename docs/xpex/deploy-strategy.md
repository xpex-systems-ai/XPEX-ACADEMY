# Estratégia de Deploy — XpeX Academy

A XpeX Academy é baseada no LearnHouse e possui arquitetura full-stack. Por isso, a estratégia de deploy deve separar demonstrações visuais de uma operação completa com backend persistente.

## Vercel para MVP visual

A Vercel pode ser usada para landing pages, páginas institucionais e protótipos do frontend. Esse caminho é útil para validar marca, oferta, copy, navegação pública e captação inicial.

Limitação: o produto completo exige API FastAPI, PostgreSQL, Redis, storage, e-mail e processos de backend que não devem depender apenas de um deploy estático/serverless simples.

## Deploy completo full-stack

Para operar a plataforma completa, recomenda-se uma infraestrutura com serviços persistentes:

- Railway
- Render
- Fly.io
- VPS com Docker
- Kubernetes ou plataforma Docker equivalente em fases futuras

## Dependências obrigatórias

- PostgreSQL
- Redis
- Storage persistente local ou S3 compatível
- Domínio configurado
- E-mail transacional
- JWT secret forte e único
- Variáveis de ambiente de produção
- Política de backup e restore
- Monitoramento de logs e saúde dos serviços


## JWT Secret obrigatório

A variável `LEARNHOUSE_AUTH_JWT_SECRET_KEY` deve ser definida no ambiente de produção.

Não use placeholders, exemplos ou valores versionados no Git. Gere uma chave forte com:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Configure o valor diretamente no provedor de deploy, como Railway, Render, Fly.io, VPS, Docker secrets ou painel equivalente. Secrets reais devem permanecer fora do Git.

## Comando de desenvolvimento local

```bash
npx learnhouse dev
```

Esse comando inicia a experiência de desenvolvimento original do LearnHouse com serviços locais e hot reload.

## Setup oficial self-hosted

```bash
npx learnhouse@latest setup
```

O setup oficial guia domínio, banco, Redis, admin, recursos opcionais e geração dos arquivos de configuração.

## Recomendação por fase

1. **Fase 01:** manter rebranding seguro e documentação.
2. **Fase 02:** publicar landing institucional em Vercel ou ambiente equivalente.
3. **Fase 03+:** validar deploy full-stack com PostgreSQL, Redis, storage, domínio, e-mail e backup.
4. **Produção:** usar Docker/Railway/Render/Fly.io/VPS com secrets reais fora do Git.

## Fase 03 — Preview público e build estável

A partir da Fase 03, a rota `/` é a landing pública oficial da XpeX Academy no App Router. O proxy deve permitir que essa rota seja resolvida diretamente por `apps/web/app/page.tsx`, inclusive em ambientes multi-tenant, sem reescrever o apex para `/auth/login`, `/home` ou `/orgs/default`.

As rotas internas permanecem separadas:

- `/home` continua sendo o hub autenticado/org picker.
- `/login` e `/signup` continuam usando o fluxo de autenticação existente.
- `/admin` continua sendo o painel administrativo.
- Rotas de organização, API, pagamentos, embeds, boards e editor continuam sob as regras específicas do LearnHouse.

O layout global não depende mais de `next/font/google`; a família padrão usa uma stack local/sistema via `--font-default`, evitando falhas de build em ambientes sem fetch externo para Google Fonts.

Para preview/deploy, valide no mínimo:

```bash
cd apps/web && pnpm install
cd apps/web && pnpm build
```

Depois do deploy, confira `/`, `/login`, `/home` e `/admin` no domínio de preview antes de promover para produção.
