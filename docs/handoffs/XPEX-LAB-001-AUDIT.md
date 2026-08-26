# XPEX-LAB-001 — Auditoria e arquitetura do Laboratório de IA

## Princípio arquitetural

O Laboratório XPeX estende o fork LearnHouse. Ele não cria um segundo LMS, um segundo motor de autorização nem um segundo sistema de progresso.

## Capacidades nativas reaproveitadas

- **Sessão e autorização:** `getAuthorizedStudentLearning()` + shell XPeX sobre autenticação LearnHouse.
- **Cursos e progresso:** Course / Trail / TrailRun / atividades e progresso já usados pelo dashboard XPeX.
- **GX / Copilot / RAG:** componente nativo `orgs/[orgslug]/(withmenu)/copilot/copilot.tsx` e serviços AI do LearnHouse.
- **Projetos colaborativos:** Boards nativos do LearnHouse, protegidos por sessão.
- **Biblioteca de recursos:** Library nativa do LearnHouse.
- **Comunidade:** domínio de communities do LearnHouse, exposto pela rota XPeX existente.
- **Trilhas:** camada XPeX construída sobre cursos/progresso reais e catálogo federado.

## Regra de verdade

O laboratório não deve exibir experimentos, horas, XP, datasets, notebooks, modelos, certificações ou projetos como existentes sem fonte de dados real. Recursos ainda não persistidos no fork aparecem como direcionadores de prática ou roadmap, nunca como KPI fictício.

## Bloco entregue

A página `/xpex/ai-lab` passa a atuar como hub profissional com:

1. hero do Laboratório GX;
2. indicadores derivados exclusivamente do aprendizado autorizado;
3. módulos de prática ligados às capacidades existentes;
4. acesso ao GX/Copilot real do fork;
5. acesso aos Boards e Library nativos do fork;
6. integração com Cursos, Atividades, Trilhas e Comunidade;
7. bancada Copilot/RAG incorporada como núcleo de IA.

## Próximos módulos seguros

Notebooks executáveis, datasets privados, sandbox de modelos/APIs e execução de código devem ser implementados como capacidades independentes somente quando houver isolamento, quota, autorização, persistência e observabilidade adequados. Até lá, o Laboratório não simula esses runtimes.
