# Módulo 5 — Automação com IA

## Resultado esperado
O aluno desenha e testa uma automação com gatilho, contexto, decisão, ação, tratamento de erro e evidência de execução.

## Roteiro de vídeo — 12 a 15 min
1. Automação começa pelo processo, não pela ferramenta.
2. Componentes: gatilho, entrada, transformação, decisão, ação e saída.
3. Onde a IA entra: classificação, extração, geração e apoio à decisão.
4. Idempotência evita repetir ações perigosas.
5. Retries, timeout, fallback e logs tornam o fluxo observável.
6. Ações sensíveis precisam de aprovação humana.

## Laboratório
Modele uma automação simples: receber um texto, classificar o assunto, gerar um rascunho de resposta e salvar o resultado para revisão. Não enviar automaticamente.

## Desafio aplicado
Criar um diagrama do fluxo com estados de sucesso e falha. Para cada etapa, registrar o que acontece se a ferramenta ou IA não responder.

## Critérios de domínio
- gatilho e saída claramente definidos;
- separa recomendação de execução;
- prevê falhas e repetição;
- registra evidência do que aconteceu.

## Evidência
Fluxograma + tabela de teste contendo pelo menos três casos normais e dois casos de falha.
