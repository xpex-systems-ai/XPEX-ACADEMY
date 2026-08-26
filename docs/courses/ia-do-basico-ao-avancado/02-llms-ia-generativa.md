# Módulo 2 — Como funcionam LLMs e IA generativa

## Objetivo
Compreender o ciclo básico de um modelo de linguagem: texto → tokens → contexto → previsão → resposta.

## Tokens e contexto
LLMs processam texto em unidades chamadas **tokens**. A janela de contexto funciona como a memória de trabalho da conversa: instruções, documentos e mensagens precisam caber nela e competir por atenção.

Durante a geração, o modelo calcula probabilidades para o próximo token repetidamente. Parâmetros de amostragem podem tornar a resposta mais previsível ou mais variada.

## Treinamento x inferência
No treinamento, parâmetros são ajustados a partir de grandes conjuntos de dados. Na inferência, esses parâmetros já treinados são usados para responder ao pedido atual. Seu prompt não “reprograma” o modelo; ele condiciona a execução daquela solicitação.

## Limitações
- conhecimento pode estar desatualizado;
- contexto pode ser insuficiente;
- o modelo pode alucinar;
- dados sensíveis exigem cuidado;
- respostas precisam de validação proporcional ao risco.

## Prática
Peça ao GX para explicar “janela de contexto” usando uma analogia. Depois peça uma explicação técnica. Compare as duas e anote o que a analogia esconde.

## Exercício
Crie uma pergunta factual difícil. Solicite: resposta, nível de confiança e quais partes precisam de verificação externa. Avalie se a confiança declarada é justificável.

**Próximo passo:** transformar entendimento em instruções melhores com Prompt Engineering.