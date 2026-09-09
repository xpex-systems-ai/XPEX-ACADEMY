# XPEX-FIRST-PROFESSIONAL-COURSE-019

## Objetivo

Publicar o primeiro curso profissional real da XPeX Academy AI sem alterar o curso controlado usado para certificação da esteira do aluno.

## Regra de preservação

O curso controlado `Inteligência Artificial — do Básico ao Avançado` e seus históricos, matrículas, progresso e certificados existentes não serão convertidos em conteúdo oficial. O primeiro produto profissional será publicado como um novo curso, com identidade própria e pipeline de mídia real.

## Curso oficial

**Título:** Inteligência Artificial Profissional — do Básico ao Avançado

**Slug:** `inteligencia-artificial-profissional`

**Posicionamento:** formação prática em IA com conteúdo audiovisual, atividades aplicadas, avaliação, projeto final e certificado verificável.

## Estrutura pedagógica

1. Fundamentos de IA e pensamento crítico
2. LLMs e IA generativa
3. Prompt Engineering profissional
4. Produtividade com IA
5. Automação com IA
6. APIs e integrações
7. RAG e conhecimento privado
8. Agentes de IA
9. Construção de projetos reais
10. IA para negócios e carreira
11. Projeto final profissional

Cada módulo deve possuir, no mínimo:

- aula em vídeo real;
- material textual de apoio;
- prática aplicada;
- checkpoint de aprendizagem;
- navegação anterior/próxima;
- progresso persistente.

O curso deve possuir avaliação formal com correção server-side, nota de corte documentada, retry quando permitido e certificado emitido apenas depois que os requisitos reais forem cumpridos.

## Política de vídeo

Não usar vídeo fictício, placeholder ou URL inventada para declarar publicação.

O player XPeX já suporta `TYPE_VIDEO` com `SUBTYPE_VIDEO_HOSTED` e `SUBTYPE_VIDEO_YOUTUBE`. A publicação profissional deve preferir mídia hospedada pela própria infraestrutura XPeX ou URL oficial controlada, com MP4/HLS browser-safe, captions e poster quando disponíveis.

Existe uma implementação experimental de geração de MP4 local em `feat/xpex-static-mp4-course-001`. Ela serve como referência técnica de empacotamento e hosting, mas o gerador com `espeak-ng` não será promovido automaticamente como material premium final.

## Gates de publicação

O curso só recebe status `PUBLISHED_PROFESSIONAL` quando:

- todos os 11 módulos existem;
- todos os vídeos reais estão resolvendo no player;
- não há activity duplicada;
- ordem das atividades é determinística;
- avaliação e passing score estão funcionais;
- projeto final está publicado;
- certificado está definido;
- Golden Path do aluno passa em produção;
- nenhum 4xx/5xx inesperado ocorre no percurso;
- o curso controlado legado permanece intacto.

## Pipeline

`currículo -> roteiro -> produção de vídeo -> revisão -> hospedagem -> activity TYPE_VIDEO -> material -> prática -> avaliação -> certificado -> CI -> deploy -> reteste de produção`

## Release

Ambiente canônico: `https://xpex-academy-ai.up.railway.app/`

A publicação será feita somente após PR, gates verdes e deployment Railway do SHA exato mergeado.
