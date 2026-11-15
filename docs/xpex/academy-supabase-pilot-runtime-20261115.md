# XPeX Academy — reconstrução sem Railway (piloto isolado)

**Objetivo:** validar matrícula, uma aula textual e progresso persistente do Polo Kelle sem plano pago e sem sobrescrever dados históricos.

## Fonte e ambiente
- Repositório: `xpex-systems-ai/XPEX-ACADEMY`
- Branch: `chore/academy-vercel-supabase-migration-audit` (PR #254, **não fazer merge automático**)
- Frontend Next.js: `/academia` (App Router), API com sessões HttpOnly: `/api/academia`
- Vercel preview conectado: projeto `xpex-academy` na conta `xpexoss@outlook.com`; o projeto `xpex-academy-ai` na outra conta foi limitado por quota diária
- Supabase novo dedicado: `krvoedwbdnvoziiaavwp` (PostgreSQL 17)
- Migration já aplicada ao Supabase: `academy_kelle_private_pilot_rls_v1`, via ferramenta de migrações Supabase, em 15/11/2026
- Tabelas com RLS: `academy_polos`, `academy_pilot_invites`, `academy_courses`, `academy_lessons`, `academy_enrollments`, `academy_progress`
- Conteúdo: uma aula **original de validação**, não o curso completo histórico; contas de teste autorizadas por convites de Polo

## Chaves de ambiente (apenas preview da branch)
- `XPEX_PILOT_SUPABASE_URL`: URL pública do projeto, não é uma senha
- `XPEX_PILOT_SUPABASE_PUBLISHABLE_KEY`: chave PUBLICÁVEL, sem privilégios administrativos
- `XPEX_PILOT_ALLOWED_EMAILS`: allowlist privada de e-mails que podem cadastrar contas de teste; não cadastrar usuários públicos nesta etapa.
- Nunca usar chave Supabase service-role no browser ou na rota do piloto. A autorização é realizada pelo Supabase Auth + RLS.
- JWT de aluno e refresh token ficam em cookies HttpOnly, Secure, SameSite=Lax, path `/api/academia`, sem persistência em localStorage; refresh via Auth endpoint.
- O login de teste com Supabase Auth **não substitui** o login canônico LearnHouse/WorkOS anterior. Vinculação de contas e importação de matrículas antigas dependem de migração revisada.

## Aceite mínimo de homologação
1. Abrir `/academia` em preview e observar formulário de login.
2. Cadastrar/confirmar conta autorizada em Supabase Auth; negar acesso aos não convidados.
3. Login e logout; confirmar isolamento entre contas e Polos.
4. Matricular-se no curso de validação com proteção a duplicatas (único por aluno + curso).
5. Abrir a aula disponível; concluir e recarregar; verificar que o progresso permanece (tabela `academy_progress`).
6. Confirmar que GET sem cookie em `/api/academia` devolve **401** e acesso a registros de outros usuários não funciona.
7. Registrar capturas sem dados pessoais, HTTP status e identificadores de teste; obter revisão humana.

## Intencionalmente pendente
- Recuperação da Railway: conta `kelledigital@outlook.com` expirada, volumes Postgres 18, Redis e mídia registrados. Não foram copiados nem modificados.
- Integração definitiva com FastAPI, Redis, Firebase e Google AI Studio. A arquitetura do core permanece no repositório, mas não foi reativada.
- Módulos GX Lab, certificados e pagamentos reais: indisponíveis na nova base; não mostrar métricas, certificados ou valores fictícios.
- Monitoração de custos e quotas. Não criar planos pagos nem assinar infraestrutura automaticamente.
- O cadastro de alunos reais (especialmente menores), emissão de certificados e processamento de pagamentos dependem de revisão de privacidade, autenticação, backup e testes completos.

## Reversibilidade e segurança
- Todos os novos objetos SQL usam prefixo `academy_`, separados dos modelos LearnHouse existentes. Nenhuma migração destrutiva.
- Senhas nunca devem constar em comentários, commits ou respostas.
- Caso o piloto falhe, desabilitar a UI e revogar os convites; não limpar dados históricos.
- O deploy READY atesta a compilação/publicação, **não** comprova que login, sessão, matrícula e progresso foram testados por usuário autorizado.
