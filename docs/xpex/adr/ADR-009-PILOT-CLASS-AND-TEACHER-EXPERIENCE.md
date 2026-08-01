# ADR-009 — Turma piloto e experiência mínima da professora

- **Status:** Proposto — em revisão
- **Data:** A confirmar
- **Missão:** XPEX-BETA-003

## Contexto

A jornada da XPEX-BETA-002 foi integrada pela PR #30 como proposta pedagógica, sem execução de turma. Era necessário converter seus seis encontros em uma configuração operacional mínima que preservasse aprendizagem, privacidade, contingência e menor privilégio sem alterar a plataforma.

## Decisões documentais

- adotar o código neutro `XPEX-PILOT-01`, nome provisório e capacidade proposta de até 10 participantes, sem afirmar matrícula;
- usar seis encontros, microentregas e estados `Não iniciado`, `Em andamento`, `Precisa de apoio` e `Concluído`, sem nota ou ranking;
- limitar a experiência docente a turma autorizada, roteiro, materiais, entregas, feedback, comunicação e progresso mínimo;
- limitar administração pós-encontro a 15 minutos de registro e 5 de comunicação;
- exigir alternativas offline, registro mínimo de incidente e gate humano de prontidão;
- tratar o dashboard apenas como requisito futuro, não funcionalidade existente.

## Hipóteses

- uma rotina fixa reduz carga cognitiva da professora;
- quatro estados e uma força/próximo passo são suficientes para intervenção pedagógica inicial;
- preparação offline mantém a aprendizagem quando a ferramenta falha;
- a carga administrativa proposta é sustentável. Somente teste humano autorizado poderá validar essas hipóteses.

## Pendências

Nome final, número real de participantes, datas/frequência, responsáveis, canal, ferramentas, consentimento, retenção/publicação, equipamentos, modalidade, acessibilidade e suporte a menores estão **A confirmar**.

## Não decisões

Não foram criados turma, pessoa, organização, curso, conta, role, permissão, dashboard, dado, integração, deploy ou recurso externo. Não se decidiu cobrança, certificação, publicação obrigatória, ferramenta oficial ou retomada de cloud.

## Trade-offs

- poucos campos protegem tempo e privacidade, mas reduzem análise detalhada;
- estados simples facilitam ação, mas não substituem a rubrica de evidências;
- menor privilégio reduz risco, mas depende de fluxos separados para administração;
- alternativas agnósticas aumentam resiliência, mas pedem preparação prévia;
- gate rigoroso pode adiar datas, mas impede início sem responsável, privacidade ou contingência.

## Consequências e revisão

A professora dispõe de um caminho operacional autocontido e a coordenação pode distinguir GO, PENDÊNCIA EXTERNA e NO-GO. Ainda é necessária decisão humana; a recomendação atual é PENDÊNCIA EXTERNA.

Revisar após teste humano explicitamente autorizado e sem dados pessoais no GitHub, ou antes se a rotina exceder o limite administrativo, a evidência não orientar apoio, acessibilidade/privacidade falhar, fallback não preservar aprendizagem ou o escopo docente conceder acesso desnecessário. Registrar sinais agregados, decisão e versão; não converter hipótese em resultado.

## Referências

- [Blueprint da turma](../beta-operation/PILOT_CLASS_BLUEPRINT.md)
- [Experiência mínima](../beta-operation/TEACHER_MINIMUM_EXPERIENCE.md)
- [Playbook](../beta-operation/SESSION_OPERATIONS_PLAYBOOK.md)
- [Acompanhamento](../beta-operation/STUDENT_PROGRESS_TRACKING.md)
- [Gate de prontidão](../beta-operation/PILOT_READINESS_GATE.md)
