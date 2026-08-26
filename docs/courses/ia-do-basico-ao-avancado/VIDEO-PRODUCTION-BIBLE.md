# XPeX Academy — Bíblia de Produção das Videoaulas

## Objetivo
Transformar os roteiros dos 11 módulos em videoaulas consistentes, modernas e auditáveis. Este documento define o padrão; ele não declara que os arquivos de vídeo já foram gravados.

## Formato de cada videoaula
Duração-alvo: **12–15 minutos**.

1. Cold open de 15–25 s com um problema real.
2. Objetivo da aula em uma frase.
3. Explicação visual do conceito.
4. Demonstração na tela.
5. Erro comum ou risco.
6. Mini exercício de 60–90 s.
7. Resumo em três pontos.
8. CTA: abrir laboratório/desafio do módulo.

## Identidade visual
- fundo escuro premium;
- acentos laranja XPeX e azul/ciano;
- títulos curtos e grandes;
- diagramas simples, sem excesso de texto;
- legendas sempre disponíveis;
- transições discretas;
- logos e elementos visuais apenas quando licenciados/autorizados.

## Áudio
Prioridade absoluta para voz clara. Usar microfone próximo, ambiente silencioso e normalização consistente. Música, quando usada, deve ficar abaixo da voz e possuir licença adequada.

## Acessibilidade
- legenda pt-BR revisada;
- contraste adequado;
- não transmitir informação essencial apenas por cor;
- explicar em voz o que aparece em diagramas importantes;
- evitar cortes rápidos que prejudiquem iniciantes.

## Arquivos
Padrão sugerido:
`xpex-ia-m01-fundamentos-v1.mp4`
`xpex-ia-m02-llms-v1.mp4`
...
`xpex-ia-m11-projeto-final-v1.mp4`

Guardar master de edição separado do arquivo final de distribuição.

## Publicação no LMS
O LearnHouse/XPeX já suporta atividades `TYPE_VIDEO` hospedadas ou YouTube. A publicação só deve ocorrer quando existir um arquivo ou URL real, validado e autorizado. O provisionador `apps/api/scripts/xpex_course_videos.py` é dry-run por padrão e recusa URLs inválidas.

## QA antes de publicar
- vídeo abre no desktop e mobile;
- áudio compreensível;
- legenda sincronizada;
- links e comandos demonstrados ainda funcionam;
- nenhuma chave, senha, e-mail privado ou dado pessoal aparece na gravação;
- conceitos conferidos pelo professor;
- laboratório correspondente existe;
- duração e título batem com o módulo.

## Pacote por módulo
Cada arquivo em `pro/` contém: resultado esperado, roteiro narrativo, laboratório, desafio, critérios de domínio e evidência. O roteirista pode expandir o roteiro para teleprompter sem alterar a promessa pedagógica.

## Regra de integridade
Nunca preencher o player com vídeo aleatório apenas para parecer completo. Mídia deve ser original/autorizada e vinculada ao módulo correto. Enquanto a gravação não existir, a plataforma deve mostrar a aula guiada e o material profissional, deixando explícito que não se trata de vídeo gravado.
