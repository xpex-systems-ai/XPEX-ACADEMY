# Módulo 5 — Automação com IA

## Objetivo
Projetar automações em que IA executa apenas a parte que realmente exige interpretação ou geração.

## Arquitetura básica
Uma automação robusta separa:

**gatilho → coleta de dados → regras determinísticas → IA → validação → ação → log.**

Nem tudo deve ser entregue ao modelo. Datas, permissões, cálculos exatos e regras críticas costumam funcionar melhor em código determinístico.

## Exemplo
Um fluxo de atendimento pode receber uma mensagem, classificar intenção com IA, consultar uma base, preparar uma resposta e exigir aprovação humana para casos de alto risco.

## Prática
Desenhe uma automação para um processo real usando caixas e setas. Marque cada etapa como:
- determinística;
- IA;
- aprovação humana;
- registro/auditoria.

## Exercício
Defina três falhas possíveis e o comportamento seguro para cada uma. Exemplo: se a IA não tiver confiança suficiente, encaminhar para revisão em vez de executar a ação final.

## Princípio
Automação madura não é “IA em tudo”. É colocar inteligência no ponto certo e manter controle sobre o restante.

**Próximo passo:** conectar aplicações e modelos por APIs.