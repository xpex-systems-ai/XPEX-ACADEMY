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

## Primeiro ciclo de acesso

Em janela anônima, teste cada conta em `/login`, confirme `/xpex` e logout. Para aluno, tente `/xpex/professora` e `/xpex/polo`; para professora, tente `/xpex/polo`. Todos devem negar. Teste `next=//example.org`, cookie de organização obsoleto, API e Redis indisponíveis, navegação/mobile e logout. Confirme que indicadores da Beta permanecem declarados fictícios. Não declare o ciclo aprovado sem evidência do backend e do navegador.
