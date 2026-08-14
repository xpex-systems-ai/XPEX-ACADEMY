# Provisionamento do Polo Kelle Digital Lab

## Blueprint

| Campo | Valor |
|---|---|
| Organização | Polo Kelle Digital Lab |
| Slug | `kelle-digital-lab` |
| Produto / modo | XpeX Academy / piloto privado |
| Localidade / fuso | `pt-BR` / `America/Sao_Paulo` |
| Local | Marajó |
| Capacidade-alvo | 10 (não cria matrículas automaticamente) |

Use somente identidades de teste, com dados mínimos. Não use estudantes reais.

## Bootstrap idempotente de teste

1. Use um ambiente não produtivo e aplique as migrações.
2. Preencha os nove nomes `XPEX_PILOT_*` no secret store. Cada senha deve satisfazer a política LearnHouse e não pode ser padrão/fraca.
3. Defina `ALLOW_PILOT_BOOTSTRAP=true` apenas durante a operação.
4. Execute `cd apps/api && uv run python cli.py xpex-pilot-bootstrap`.
5. Remova/desative a flag imediatamente. A saída informa somente estados, nunca senhas.

O comando instala/verifica os papéis LearnHouse, cria ou verifica a organização, cria uma conta de teste administrator (Admin), teacher (Instructor) e student (Member), e cria associações ausentes. Reexecução não duplica registros. Conflitos de username, papel ou associação são recusados sem sobrescrita silenciosa. Produção é recusada mesmo com a flag.

As três identidades precisam ter usernames e e-mails distintos (e-mails são comparados após trim/lowercase). Uma conta já existente só é reutilizada quando identidade, e-mail verificado, bloqueio, senha configurada e papel existente são compatíveis. O bootstrap verifica a senha sem alterá-la; incompatibilidade aborta todo o preflight. Variável ausente produz erro controlado contendo apenas o nome da configuração ausente.

Organização, usuários novos e memberships são gravados em um único commit lógico. Falha posterior ao primeiro `flush` executa rollback, inclusive da organização recém-criada. O operador deve executar o comando três vezes no ambiente de teste e confirmar que todas retornam `ready` sem crescimento das contagens antes do ciclo de login no navegador.

## Primeiro ciclo de acesso

Em janela anônima, teste cada conta em `/login`, confirme `/xpex` e logout. Para aluno, tente `/xpex/professora` e `/xpex/polo`; para professora, tente `/xpex/polo`. Todos devem negar. Teste `next=//example.org`, cookie de organização obsoleto, API e Redis indisponíveis, navegação/mobile e logout. Confirme que indicadores da Beta permanecem declarados fictícios. Não declare o ciclo aprovado sem evidência do backend e do navegador.
