# Módulo 6 — APIs e integrações

## Objetivo
Entender como aplicações trocam dados e como integrar IA a sistemas reais com segurança.

## Conceitos
Uma API define um contrato entre sistemas. Em APIs HTTP, você encontrará métodos como `GET`, `POST`, `PATCH` e `DELETE`, códigos de status e dados em JSON.

Exemplo conceitual:

```json
{
  "task": "resumir",
  "content": "texto de entrada"
}
```

## Segurança
Nunca coloque chaves secretas no frontend ou em repositórios públicos. Segredos devem permanecer no servidor ou em um gerenciador de secrets. A aplicação também deve validar autenticação, autorização, tamanho das entradas, timeouts e erros do provedor.

## Prática
Desenhe uma integração em que um formulário envia um texto para seu backend, o backend chama um modelo e devolve um resumo. Identifique exatamente onde a chave da API deve ficar.

## Exercício
Escreva os contratos de entrada e saída para uma API de “gerador de plano de estudos”. Inclua campos obrigatórios, resposta de sucesso e pelo menos dois erros esperados.

## Checklist
- [ ] Entendo request/response.
- [ ] Sei por que secrets não pertencem ao cliente.
- [ ] Consigo pensar em erros e validação antes de integrar.

**Próximo passo:** conectar modelos a conhecimento privado usando RAG.