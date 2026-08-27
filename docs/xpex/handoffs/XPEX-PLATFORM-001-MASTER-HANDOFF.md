# XPEX-PLATFORM-001 — MASTER HANDOFF

## Missão
Unificar a experiência operacional da XPeX Academy em uma única camada premium, mantendo LearnHouse como core e Railway como runtime invisível ao usuário final.

## Problema auditado
Hoje existem superfícies paralelas: experiência premium XPeX, rotas nativas LearnHouse, Course Studio, Video Studio e painel de plataforma. A sessão premium pode exibir papel de Aluno mesmo quando o backend autoriza operações editoriais, porque a UX usa somente o papel canônico da associação para escolher a experiência. Isso produz falta de clareza, links dispersos e dependência operacional de URLs técnicas.

## Arquitetura alvo
- URL oficial: frontend XPeX/Vercel.
- Runtime/API: Railway, sem necessidade de navegação manual pelo operador.
- LearnHouse: core de cursos, atividades, matrículas, mídia e progresso.
- Autorização administrativa: sempre validada pelo backend; a UI não promove usuário por nome, e-mail ou parâmetro de rota.
- Control Center: `/xpex/control-center`.

## Navegação administrativa
1. Visão Geral
2. Cursos
3. Fábrica de Cursos IA
4. Produção Audiovisual
5. Alunos e matrículas
6. Comunidade
7. Analytics
8. Configurações

## Regra de autorização
A entrada no Control Center deve ser capability-driven. O frontend usa o token da sessão e consulta um endpoint editorial protegido do backend. Somente uma resposta autorizada libera o painel. Um parâmetro de URL ou o rótulo visual `Aluno` nunca concede privilégio.

## Produção audiovisual
O Control Center deve consolidar os jobs do CONTENT-003 e mostrar os estados:
`QUEUED → SCRIPTING → STORYBOARDING → NARRATING → ASSET_GENERATION → RENDERING → REVIEWING → AWAITING_HUMAN_APPROVAL → APPROVED → ATTACHED → PUBLISHED`, além de `FAILED/CANCELLED`.

Nenhum vídeo é aprovado ou publicado automaticamente. O painel apenas torna o gate humano operacional e visível.

## Entregáveis desta missão
- [x] handoff mestre versionado;
- [x] capability probe server-side para revelar acesso administrativo dentro da shell XPeX;
- [x] entrada `Painel Admin` na navegação quando o backend autorizar;
- [x] `/xpex/control-center` com visão de cursos editoriais e jobs de vídeo;
- [x] links operacionais centralizados sem exigir Railway/GitHub;
- [ ] CI verde;
- [ ] merge em `dev`;
- [ ] deploy Railway/Vercel;
- [ ] smoke autenticado com conta administrativa;

## Gates
- fail closed em erro/403;
- nenhum segredo no browser;
- nenhum bypass por e-mail ou nome de role;
- nenhum publish automático;
- merge somente com CI verde.
