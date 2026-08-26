# Módulo 6 — APIs e integrações

## Resultado esperado
O aluno entende como aplicações trocam dados e consegue descrever uma integração segura com método, endpoint, autenticação, payload, resposta e tratamento de erro.

## Roteiro de vídeo — 12 a 15 min
1. API como contrato entre sistemas.
2. Métodos HTTP: leitura, criação, atualização e remoção.
3. JSON como formato comum de troca de dados.
4. Autenticação, autorização e por que segredo nunca vai para código público.
5. Status HTTP, limites de taxa e retries.
6. Testar primeiro em ambiente seguro e registrar requests sem expor segredos.

## Laboratório
Use uma API pública ou ambiente de demonstração aprovado pelo professor. Faça uma leitura simples, identifique endpoint, parâmetros e resposta. Depois desenhe como a resposta poderia alimentar uma etapa de IA.

## Desafio aplicado
Escrever a especificação de uma integração real: origem dos dados, destino, autenticação, payload, resposta esperada, erros possíveis e plano de fallback.

## Critérios de domínio
- escolhe método coerente;
- diferencia autenticação de autorização;
- protege chaves;
- interpreta status de sucesso e erro;
- prevê limites e falhas.

## Evidência
Ficha técnica da integração + exemplo sanitizado de request/response sem credenciais reais.
