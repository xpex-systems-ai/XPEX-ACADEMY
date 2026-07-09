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
