# Governança de Ambientes — XpeX Academy

## Objetivo

Separar com clareza desenvolvimento, preview, Beta pública e produção estável sem criar novos projetos duplicados, alterar domínios por tentativa ou publicar código não validado.

## Estado verificado na missão XPEX-BETA-006B

- Repositório oficial: `xpex-systems-ai/XPEX-ACADEMY`.
- Branch padrão atual do GitHub: `dev`.
- O repositório ainda não possui uma branch estável chamada `main` ou `production`.
- Projeto oficial da Vercel: `xpex-academy-ai`.
- Root Directory oficial: `apps/web`.
- A branch `dev` está conectada ao target público de produção da Vercel.
- Os projetos `xpex-academy` e `xpex-academy-536s` permanecem em quarentena operacional: não devem receber domínios, variáveis ou novos deploys.

## Política temporária da Beta pública

Enquanto não existir uma branch estável separada, a operação adota formalmente:

| Camada | Branch / ambiente | Finalidade |
|---|---|---|
| Desenvolvimento isolado | `codex/*`, `feat/*`, `fix/*` | Implementação e correções em branch própria |
| Preview | deployment de Pull Request | Build, inspeção visual e smoke test antes do merge |
| Beta pública | `dev` | Ambiente público demonstrativo, sem dados reais e sem promessa de produção completa |
| Produção estável | ainda não criada | Só será ativada após backend persistente, autenticação, secrets, observabilidade e política de rollback |

A classificação da `dev` como Beta pública é temporária. Ela não deve ser descrita como produção completa da plataforma.

## Regra de promoção

Nenhuma alteração deve ser enviada diretamente para `dev` como fluxo normal.

1. Criar branch a partir da `dev` atualizada.
2. Implementar mudanças de escopo único.
3. Abrir Pull Request para `dev`.
4. Confirmar build da Vercel em Preview.
5. Executar testes e smoke test das rotas afetadas.
6. Revisar claims públicos, dados fictícios e ausência de secrets.
7. Fazer merge somente após estado verde.
8. Verificar o deployment público gerado pela `dev`.

## Critérios mínimos de aprovação

- Build do `apps/web` concluído.
- TypeScript sem erro bloqueador.
- Rotas públicas principais respondendo com sucesso.
- Nenhuma variável secreta adicionada ao Git.
- Nenhuma chamada real ao backend introduzida nas experiências demonstrativas sem missão específica.
- Botões não funcionais identificados como Preview, Demo ou Em breve.
- Datas demonstrativas não apresentadas como agenda real.
- Marca XpeX preservada nas superfícies públicas.
- Atribuição ao motor open-source e à licença preservada onde aplicável.

## Migração recomendada para produção estável

Quando a plataforma estiver pronta para sair da Beta visual:

1. Criar a branch `production` a partir de um commit auditado da `dev`.
2. Proteger `production` contra push direto.
3. Exigir Pull Request, build verde e revisão para promoção.
4. No projeto oficial `xpex-academy-ai`, alterar a Production Branch da Vercel de `dev` para `production`.
5. Manter `dev` como ambiente de integração e Preview/Staging.
6. Validar os domínios oficiais somente no projeto `xpex-academy-ai`.
7. Executar smoke test pós-promoção e registrar o commit publicado.

A troca da Production Branch não deve ocorrer antes da criação, proteção e validação da branch estável.

## Rollback

Em caso de regressão pública:

1. Identificar o último deployment READY conhecido.
2. Interromper novos merges na branch pública.
3. Reverter o Pull Request causador ou promover novamente o último commit validado.
4. Confirmar `/`, `/login`, `/beta/aluno`, `/beta/professora`, `/beta/polo` e uma rota 404.
5. Registrar causa, impacto e correção em issue ou Pull Request.

Não corrigir regressão criando outro projeto Vercel.

## Projetos duplicados

Até uma missão específica de limpeza:

- não excluir;
- não atribuir domínio;
- não copiar variáveis;
- não promover deployment;
- não usar como fallback;
- manter apenas como evidência histórica da auditoria.

## Stop conditions

A promoção deve parar imediatamente quando houver:

- build ou TypeScript vermelho;
- divergência de Root Directory;
- branch pública diferente da documentada;
- secrets ou credenciais em diff;
- dependência de backend indisponível apresentada como funcional;
- login expondo `.localhost` ao público;
- alteração de domínio sem plano de rollback;
- claims institucionais, financeiros ou educacionais não verificados.
