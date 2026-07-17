# Instruções permanentes para agentes — XpeX Academy

## Identidade e propósito

A XpeX Academy é a camada estratégica de produto deste fork do LearnHouse. O repositório deve preservar o motor técnico open-source do LearnHouse e evoluir a plataforma de forma incremental, auditável e compatível com upstream.

## Preservação LearnHouse e licença

- Preserve a licença AGPL-3.0, os avisos legais, as atribuições e os links obrigatórios ao LearnHouse.
- Não remova referências técnicas necessárias ao upstream.
- Não altere nomes técnicos `LEARNHOUSE_*` sem autorização explícita.
- Qualquer rebranding deve ser seguro, documentado e reversível.

## Arquitetura atual do monorepo

- `apps/web`: frontend Next.js para experiências públicas, alunos, professores e administração.
- `apps/api`: backend FastAPI com autenticação, autorização, cursos, organizações, IA, pagamentos e integrações.
- `apps/collab`: colaboração em tempo real.
- `apps/cli`: CLI operacional herdada do LearnHouse.
- `docker/`, `Dockerfile` e arquivos relacionados: empacotamento, proxy e execução self-hosted.
- `docs/`: documentação técnica, estratégica e operacional.

## Regras de missão

- Execute uma missão por branch.
- Cada missão deve ter escopo explícito, arquivos permitidos, arquivos proibidos, critérios de aceite e validação.
- Não faça mudanças fora do escopo autorizado.
- Não misture correções funcionais, refatorações e documentação em uma mesma missão sem autorização.
- Toda missão deve terminar em branch dedicada e Pull Request revisável.

## Áreas críticas

Nunca altere sem autorização explícita:

- Autenticação, autorização, RBAC, permissões e sessão.
- Modelos de banco, migrações e dados persistentes.
- API FastAPI e contratos públicos.
- Proxy multi-tenant, resolução de organizações e domínios.
- Pagamentos, Stripe, webhooks e faturamento.
- Redis, storage, e-mail, Docker, Nginx e infraestrutura.
- Lockfiles, dependências e gerenciadores de pacote.
- Secrets, chaves, tokens, credenciais ou valores reais de ambiente.

## Segurança por design

- Nunca versione secrets.
- Use arquivos `.example` para documentar variáveis sensíveis.
- Avalie impacto multi-tenant antes de alterar rotas, domínios, autenticação ou dados de organização.
- Prefira mudanças pequenas, testáveis e reversíveis.
- Documente riscos conhecidos e limitações quando houver.

## Testes, validação e documentação

- Execute testes e validações proporcionais ao escopo.
- Para documentação, valide sintaxe, links relativos relevantes, ausência de secrets e ausência de alterações funcionais.
- Para código, inclua testes automatizados ou justifique tecnicamente quando não forem aplicáveis.
- Atualize documentação sempre que comportamento, operação ou governança mudarem.

## Pull Requests

Toda Pull Request deve registrar:

- Motivação e escopo.
- Arquivos alterados.
- Testes e validações executados.
- Riscos e itens fora de escopo.
- Confirmação de que licença, atribuição LearnHouse e compatibilidade upstream foram preservadas.
- Aprovação humana antes de merge.
