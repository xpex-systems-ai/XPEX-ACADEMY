# Acesso real — auditoria e operação do piloto

## Arquitetura reutilizada

Esta missão **não cria autenticação, usuário, organização ou tenant paralelo**. O login usa `apps/api/src/routers/auth.py`; a sessão autenticada vem de `GET /api/v1/users/session`; `User`, `Organization`, `UserOrganization` e `Role` continuam sendo as fontes de verdade. A associação retornada pela API contém, no mesmo registro, a organização e o papel. A experiência `/xpex` filtra essa resposta pelo slug `kelle-digital-lab` e mapeia `Admin → polo`, `Instructor → professora` e `Member → aluno`. Um segmento de URL ou seletor visual nunca concede função.

Os previews `/beta/aluno`, `/beta/professora` e `/beta/polo` continuam públicos e explicitamente fictícios. `/xpex` é o shell autenticado. O cookie marcador `LH_session` serve somente para redirecionamento antecipado; a autorização final depende da sessão obtida da API. Associação ausente, organização diferente ou papel desconhecido falham sem fallback privilegiado e exibem orientação em pt-BR.

## Fluxos existentes auditados

- Credenciais, Google OAuth, refresh e logout: router e contexto Auth existentes.
- Cadastro: o serviço de usuários cria `UserOrganization` com o papel global Member; convite reutiliza o mesmo serviço.
- Organização: routers/services de organizações e `install_create_organization` criam a organização e sua configuração.
- Autorização: RBAC existente usa papel, direitos e escopo da organização; o novo shell apenas reduz a navegação, não substitui autorização de API.
- Migrações: Alembic em `apps/api/migrations`; nenhuma migração é adicionada nesta missão.

## Inicialização exata

1. PostgreSQL e Redis devem estar acessíveis e as variáveis abaixo configuradas em secret stores.
2. Em `apps/api`, execute `uv run alembic upgrade head`.
3. Inicie a API pela raiz com `bun run dev:api`, equivalente a `cd apps/api && LEARNHOUSE_DEVELOPMENT_MODE=true uv run uvicorn app:app --host 0.0.0.0 --port 9000 --reload`.
4. Configure a URL pública da API no runtime do web conforme o mecanismo existente de `apps/web/services/config`; não exponha Redis ou SQL ao browser.
5. Inicie o web com `bun run dev:web`. Em deploy, Vercel usa `apps/web`; a API exige um host Docker/FastAPI persistente (Railway, Render, Fly.io ou equivalente).

## Segurança e limitações

Rate limiting, lockout, verificação de e-mail, Turnstile, cookies, CSRF e safe redirect existentes não foram desativados. Contas criadas pelo bootstrap são verificadas individualmente para o teste autorizado; isso não altera a política global. Esta alteração não comprova disponibilidade de PostgreSQL, Redis, e-mail, login em navegador nem deploy público: esses itens exigem o ambiente integrado e a revisão manual.

Contas preexistentes não são marcadas como prontas apenas por coincidência de username/e-mail: o preflight exige estado verificável, senha compatível, e-mail verificado, ausência de lockout vigente e membership/papel coerentes. Senhas existentes nunca são redefinidas pelo bootstrap.

## Rollback

Reverta o commit desta missão. Se o bootstrap foi executado, remova primeiro as três associações de teste e contas de teste pela administração LearnHouse e depois o polo somente se estiver vazio. Não execute SQL destrutivo e não remova contas ou organizações preexistentes.
