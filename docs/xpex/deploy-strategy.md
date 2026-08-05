# Estratégia de Deploy — XpeX Academy

A XpeX Academy é baseada no LearnHouse e possui arquitetura full-stack. Por isso, a estratégia de deploy deve separar demonstrações visuais de uma operação completa com backend persistente.

## Vercel para MVP visual

A Vercel pode ser usada para landing pages, páginas institucionais e protótipos do frontend. Esse caminho é útil para validar marca, oferta, copy, navegação pública e captação inicial.

Limitação: o produto completo exige API FastAPI, PostgreSQL, Redis, storage, e-mail e processos de backend que não devem depender apenas de um deploy estático/serverless simples.

## Landing pública e domínios de organização

A landing institucional da XpeX Academy deve responder em `/` apenas em `localhost` para desenvolvimento ou no domínio raiz/apex configurado da plataforma. O proxy compara o host recebido com `frontend_domain` e `top_domain` da instância depois de normalizar protocolo, path, porta, caixa e ponto final.

Em ambientes multi-tenant, subdomínios de organização e custom domains continuam reservados ao resolver tenant-scoped do LearnHouse, portanto a raiz `/` desses hosts deve abrir o conteúdo da organização, não a landing global. Em ambientes single-tenancy/self-host, um host não configurado como apex também continua no rewrite tenant-scoped para `/orgs/default/`.

O layout raiz não depende mais de `next/font/google`; a aplicação usa uma stack local/sistema definida em CSS para permitir build e deploy em ambientes sem fetch externo para Google Fonts. O app web também declara `@codemirror/language` diretamente para manter o build estável com o grafo CodeMirror 6.

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

## Governança de branches e ambientes

A política oficial de branches, Preview, Beta pública, promoção e rollback está documentada em [`environment-governance.md`](./environment-governance.md).

Durante a fase Beta, a branch `dev` pode alimentar temporariamente o ambiente público apenas quando toda alteração passar por branch isolada, Pull Request, Preview verde e smoke test. A migração futura para uma branch `production` deve ocorrer como mudança controlada, nunca como ajuste direto e sem rollback no painel da Vercel.
