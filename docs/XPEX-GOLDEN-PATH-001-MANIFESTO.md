# XPEX-GOLDEN-PATH-001 — Manifesto Oficial de Execução

Status: **MISSION LOCKED**
Owner operacional: **GX / Junior Sena**
Escopo: **primeiro fluxo educacional completo XPeX, de ponta a ponta**
Regra: **não mudar de assunto, não ampliar escopo e não declarar READY antes do E2E completo**.

---

## 1. Missão

Entregar e certificar o primeiro fluxo completo de aprendizagem da XPeX:

**criar curso → gerar conteúdo → gerar MP4 → publicar → matricular aluno → player → materiais → atividade → progresso → conclusão → certificado**

Esta sequência é o **Golden Path oficial da XPeX**. Toda implementação futura deve preservar este fluxo e reutilizar seus contratos sempre que possível.

---

## 2. Princípio operacional

Nenhuma etapa é considerada pronta apenas porque o código existe.

A missão só avança pelos gates:

**CODAR → TESTAR → CI → REVIEW → MERGE → DEPLOY → RUNTIME → E2E → READY**

Se um gate crítico falhar, o fluxo para naquele ponto.

---

## 3. Definição de PASS por etapa

### 3.1 Criar curso
PASS quando:
- curso é criado sem duplicação indevida;
- pertence à organização correta;
- possui título, descrição, estrutura e estado coerentes;
- pode ser reexecutado de forma idempotente ou retomável.

### 3.2 Gerar conteúdo
PASS quando:
- módulos e aulas são gerados;
- objetivos de aprendizagem estão presentes;
- conteúdo de aula existe;
- revisão editorial/pedagógica aprova ou bloqueia explicitamente;
- conteúdo não depende de placeholder para ser considerado completo.

### 3.3 Gerar MP4
PASS quando:
- o pipeline produz arquivo de vídeo real;
- saída compatível com web player (preferencialmente H.264/AAC, faststart);
- falha de provider é explícita e não gera falso positivo;
- não usar imagem estática estendida como substituto silencioso de vídeo generativo quando a missão exigir motion video.

### 3.4 Publicar
PASS quando:
- curso e aulas ficam disponíveis no Learning Core;
- mídia está vinculada à atividade/aula correta;
- publicação não cria itens órfãos ou duplicados;
- rota publicada responde no runtime.

### 3.5 Matricular aluno
PASS quando:
- aluno é convidado/criado pelo fluxo oficial;
- matrícula no curso é confirmada;
- nenhuma senha existente é alterada sem necessidade;
- aluno recebe acesso apenas ao que lhe é permitido.

### 3.6 Player
PASS quando:
- aluno abre a aula real;
- player renderiza;
- MP4 carrega e inicia reprodução;
- não há 4xx/5xx bloqueando o vídeo;
- player funciona na área do aluno, não apenas no admin/editor.

### 3.7 Materiais
PASS quando:
- aluno visualiza materiais vinculados à aula ou módulo;
- links/arquivos abrem corretamente;
- materiais respeitam permissão de matrícula;
- nenhum material essencial aponta para placeholder inexistente.

### 3.8 Atividade
PASS quando:
- atividade/quiz/exercício é acessível;
- aluno consegue enviar ou concluir;
- resposta é persistida;
- feedback/resultado aparece quando aplicável.

### 3.9 Progresso
PASS quando:
- progresso muda após consumo/conclusão da aula;
- valor persiste após refresh/relogin;
- backend e interface exibem estado consistente;
- nenhuma conclusão é simulada apenas no frontend.

### 3.10 Conclusão
PASS quando:
- regra de conclusão do curso é satisfeita de verdade;
- curso muda para estado concluído para o aluno;
- conclusão deriva das regras do Learning Core, não de flag manual temporária.

### 3.11 Certificado
PASS quando:
- certificado é liberado somente após conclusão válida;
- aluno consegue visualizar ou baixar/abrir o certificado pelo fluxo oficial;
- certificado identifica corretamente aluno, curso e conclusão;
- se o Learning Core já possuir mecanismo nativo, reutilizá-lo em vez de criar um sistema paralelo.

---

## 4. Golden Path E2E obrigatório

A prova final da missão é este caminho executado como aluno real:

1. login do aluno;
2. entrar em `/xpex/aluno` ou rota oficial equivalente;
3. abrir o curso publicado;
4. abrir a primeira aula;
5. reproduzir o MP4;
6. acessar os materiais;
7. concluir a atividade/quiz;
8. verificar atualização de progresso;
9. concluir as exigências do curso;
10. validar estado de conclusão;
11. abrir o certificado.

Sem essa sequência validada, o estado máximo permitido é **RISK** ou **BLOCKED** — nunca READY.

---

## 5. Gates de engenharia

Para cada mudança que afete o Golden Path:

- **CODE** — implementação concluída;
- **TEST** — testes locais/automatizados relevantes passam;
- **CI** — checks obrigatórios no GitHub passam;
- **REVIEW** — diff revisado por risco, arquitetura e regressão;
- **MERGE** — somente após gates anteriores;
- **DEPLOY** — ambiente recebe o commit esperado;
- **RUNTIME** — serviço saudável, rotas/API/logs validados;
- **E2E** — jornada real do aluno executada;
- **READY** — somente quando todos os gates críticos estiverem verdes.

---

## 6. Regras de não regressão

Durante esta missão:

- não quebrar autenticação de superadmin, polo ou aluno;
- não excluir contas, cursos, matrículas ou dados existentes;
- não alterar credenciais sem necessidade explícita;
- não criar um segundo LMS paralelo ao LearnHouse;
- não duplicar mecanismos nativos de progresso/certificado se já existirem;
- não considerar prefetch HTTP como prova de experiência visual;
- não considerar rota 200 como prova de player funcional;
- não considerar deploy SUCCESS como prova de E2E;
- não mover o foco para marketing, redesign, pagamento ou features secundárias antes de certificar o Golden Path, salvo bloqueio direto do próprio fluxo.

---

## 7. Estados permitidos

Use apenas estes estados operacionais:

- `TODO`
- `IN_PROGRESS`
- `BLOCKED`
- `RISK`
- `PASS`
- `READY`

Formato recomendado por subetapa:

```text
COURSE_CREATE = PASS | RISK | BLOCKED
CONTENT = PASS | RISK | BLOCKED
MP4 = PASS | RISK | BLOCKED
PUBLISH = PASS | RISK | BLOCKED
ENROLLMENT = PASS | RISK | BLOCKED
PLAYER = PASS | RISK | BLOCKED
MATERIALS = PASS | RISK | BLOCKED
ACTIVITY = PASS | RISK | BLOCKED
PROGRESS = PASS | RISK | BLOCKED
COMPLETION = PASS | RISK | BLOCKED
CERTIFICATE = PASS | RISK | BLOCKED
E2E = PASS | RISK | BLOCKED
```

Estado final permitido:

```text
XPEX-GOLDEN-PATH-001 = READY
```

Somente se todas as etapas críticas tiverem evidência real.

---

## 8. Ordem oficial de execução

1. `XPEX-GOLDEN-PATH-001A` — CI/API Tests da fábrica;
2. merge da fábrica somente com gates verdes;
3. deploy e runtime da fábrica;
4. gerar/certificar primeiro curso;
5. gerar/certificar MP4 da primeira aula;
6. publicar curso e atividade no Learning Core;
7. matricular aluno de teste;
8. validar área do aluno e player;
9. validar materiais;
10. validar atividade/quiz;
11. validar progresso persistente;
12. validar conclusão;
13. validar certificado;
14. executar E2E final;
15. declarar `XPEX-GOLDEN-PATH-001 = READY`.

---

## 9. Regra mestre

> **Não confundir código escrito com produto funcionando.**
>
> **Não confundir deploy com jornada do aluno.**
>
> **A verdade final é o E2E real.**

Este arquivo é a âncora oficial da missão. Se a execução se desviar, voltar a este manifesto e retomar a próxima etapa não certificada do Golden Path.
