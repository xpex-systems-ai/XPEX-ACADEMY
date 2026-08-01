# Estado operacional da Beta

**Atualização de referência:** XPEX-BETA-003. Datas não comprovadas são registradas como `A confirmar`. O blueprint operacional está em revisão e não representa configuração real.

## Quadro de estado

| Tipo | Item | Estado |
|---|---|---|
| Decisão estratégica | Fase vigente | Operação Beta |
| Decisão estratégica | Meta | Validar a primeira turma oficial com 10 alunos fundadores |
| Decisão estratégica | Hub inicial | Polo Kelle Digital Lab |
| Decisão estratégica | Prioridades | Alunos, currículo e conteúdo, vídeos, projetos, experiência docente, feedback e plataforma Beta mínima |
| Estado comprovado no repositório | Base técnica | LearnHouse; apps web, API, collab e CLI; documentação, automações e artefatos de staging existentes |
| Estado comprovado no histórico | Trabalho integrado | Histórico técnico integrado até a PR #28; isso não comprova deploy GCP |
| Decisão estratégica | Rota inicial | GitHub e Vercel |
| Decisão estratégica | Pausa | Novas expansões Google Cloud, sem apagar infraestrutura ou workflows existentes |
| Hipótese | Tamanho da primeira turma | 10 alunos é o recorte adequado para validar jornada e operação |
| Hipótese | Polo inicial | Kelle Digital Lab oferece contexto adequado para a primeira validação |
| Hipótese | Produto mínimo | Conteúdo, projeto, suporte docente e dashboard mínimo serão suficientes para obter feedback útil |

## Riscos e controles

| Risco | Controle |
|---|---|
| Tratar a meta como matrícula confirmada | Usar sempre “meta”; registrar evidência apenas após execução autorizada |
| Retomar infraestrutura antes da necessidade | Exigir evidência de uso ou necessidade e nova decisão registrada |
| Construir plataforma sem validar aprendizagem | Aplicar a regra oficial em cada critério de aceite |
| Expor dados pessoais | Usar apenas placeholders e artefatos sem dados reais |
| Colidir IDs históricos | Reservar `XPEX-BETA-NNN` para a operação atual |
| Confundir plano/readiness com deploy | Registrar explicitamente que não há declaração de deploy GCP |

## Transição vigente

- **Antes da integração:** XPEX-BETA-002 está em revisão na PR #30; nenhum merge é presumido.
- **Condição de conclusão:** merge da PR #30 na branch `dev`.
- **Após a integração:** XPEX-BETA-002 está concluída como proposta pedagógica documental. Isso não comprova que turma, calendário, professor ou projeto tenham sido executados.
- **Missão documental atual:** `XPEX-BETA-003 — Turma piloto e experiência docente` está em revisão; após o merge da PR da missão, será concluída somente como blueprint operacional documental. Isso não configura turma, professor, usuários ou painel.
- **Próxima missão após a integração:** `XPEX-BETA-004`, planejada e não executada. Escopo e limites estão no [Roadmap Beta](BETA_ROADMAP.md#xpex-beta-004--dashboard-mínimo-do-aluno).
