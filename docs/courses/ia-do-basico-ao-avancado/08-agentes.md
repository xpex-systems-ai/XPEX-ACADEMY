# Módulo 8 — Agentes de IA

## Objetivo
Compreender a diferença entre uma resposta isolada e um sistema que executa uma missão usando ferramentas e verificações.

## Modelo mental
Um agente útil combina:

**objetivo → contexto → plano → ferramentas → ações → observações → validação.**

Ferramentas podem incluir busca, banco de dados, código, calendário, GitHub ou sistemas internos. Cada ferramenta precisa de permissões claras e entradas validadas.

## Estados operacionais
Não confunda:

`REQUESTED → ACKNOWLEDGED → RUNNING → COMPLETED → VERIFIED`

Uma ação solicitada ainda não aconteceu; uma ação concluída ainda pode precisar de prova.

## Prática
Projete um agente para uma tarefa simples. Defina:
- missão;
- ferramentas permitidas;
- ações proibidas;
- condição de sucesso;
- evidência exigida;
- quando pedir aprovação humana.

## Exercício
Crie uma tabela de riscos para seu agente: ação errada, dado incorreto, ferramenta indisponível, permissão insuficiente e repetição acidental. Para cada risco, proponha uma proteção.

## Princípio
Autonomia útil é autonomia governada: escopo mínimo, logs, rollback e verificação.

**Próximo passo:** combinar esses conceitos em projetos reais.