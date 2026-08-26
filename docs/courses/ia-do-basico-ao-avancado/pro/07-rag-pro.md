# Módulo 7 — RAG e conhecimento privado

## Resultado esperado
O aluno entende como recuperar fontes relevantes para responder com contexto privado e sabe que autorização, qualidade da base e citação são parte da solução.

## Roteiro de vídeo — 12 a 15 min
1. Por que não colocar toda a base diretamente no prompt.
2. Pipeline RAG: ingestão, segmentação, embeddings, busca, contexto e resposta.
3. Busca semântica aproxima significado, não garante verdade.
4. Filtros de acesso precisam acontecer antes de entregar conteúdo ao modelo.
5. Citação permite ao usuário auditar a resposta.
6. Resposta correta quando a fonte não existe: admitir ausência de evidência.

## Laboratório GX
Monte uma base pequena com três a cinco documentos de aula autorizados. Crie perguntas fáceis, ambíguas e fora do escopo. Compare quando o sistema deve responder, pedir contexto ou dizer que não encontrou fonte suficiente.

## Desafio aplicado
Desenhar um mini-RAG para uma escola, negócio ou projeto comunitário contendo: fontes, quem pode acessar, estratégia de busca e como a resposta mostrará evidências.

## Critérios de domínio
- explica diferença entre modelo e base documental;
- inclui autorização;
- exige fonte relevante;
- sabe rejeitar resposta sem evidência.

## Evidência
Diagrama do pipeline + conjunto de cinco perguntas de teste com resultado esperado.
