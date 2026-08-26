# Módulo 7 — RAG e conhecimento privado

## Objetivo
Entender como dar a um modelo acesso controlado a documentos relevantes sem depender apenas do que foi aprendido no treinamento.

## O que é RAG
**Retrieval-Augmented Generation** combina busca e geração:

1. documentos são preparados e indexados;
2. a pergunta é transformada em uma consulta;
3. trechos relevantes são recuperados;
4. esses trechos entram no contexto do modelo;
5. o modelo responde com base no material fornecido.

RAG não garante verdade automaticamente. A qualidade depende de ingestão, divisão dos documentos, busca, permissões, contexto e instruções.

## Prática
Escolha um conjunto pequeno de documentos que você conhece. Defina cinco perguntas que deveriam ser respondidas e duas que **não** deveriam ser respondidas por falta de evidência.

## Exercício
Projete um RAG para uma empresa. Liste:
- fontes autorizadas;
- quem pode acessar cada fonte;
- frequência de atualização;
- como citar evidências;
- o que fazer quando a busca não encontra suporte.

## Regra de segurança
Recuperação deve respeitar autorização. Um bom RAG nunca usa a conveniência da busca como desculpa para atravessar fronteiras de acesso.

**Próximo passo:** dar ferramentas, memória de trabalho e objetivos a agentes de IA.