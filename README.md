# XpeX Academy

## Plataforma Global de Desenvolvimento Profissional com Inteligência Artificial

**Lema oficial:** Aprenda. Pratique. Construa. Evolua.

XpeX Academy é a camada estratégica de produto deste fork, construída sobre o motor técnico do **LearnHouse**. O objetivo é preservar a arquitetura original de LMS open-source e evoluí-la, de forma compatível e segura, para uma plataforma global com cursos, trilhas, ferramentas, IA, portfólio, certificados, comunidade e oportunidades de trabalho.

> **Compliance:** este repositório mantém a licença AGPL-3.0, atribuições e referências legais obrigatórias ao projeto base LearnHouse. O rebranding desta fase é intencionalmente seguro: documentação, configurações padrão e mensagens públicas simples, sem alterar autenticação, pagamentos, banco, permissões ou migrações.

## Módulos Estratégicos

- **Global Skills Hub** — catálogo global de habilidades profissionais e competências emergentes.
- **Trilhas XpeX** — jornadas guiadas para desenvolvimento técnico, criativo, empreendedor e profissional.
- **Cursos Oficiais** — programas estruturados com curadoria da XpeX Academy.
- **Cursos Próprios** — criação e publicação de cursos por times, especialistas e organizações.
- **Hub de Ferramentas** — recursos, templates, ferramentas e automações para prática profissional.
- **Professor IA** — apoio inteligente para aprendizado, prática, feedback e evolução contínua.
- **Certificados** — emissão de comprovações de conclusão e domínio de competências.
- **Portfólio** — vitrine de projetos, entregas e evidências práticas do aluno.
- **XpeX TV** — conteúdo audiovisual educacional e institucional.
- **Blog** — artigos, guias, notícias e materiais de aprofundamento.
- **Comunidade** — fóruns, discussões, networking e colaboração entre membros.
- **Jobs & Freelance Hub** — ponte futura entre aprendizado, projetos, vagas e oportunidades.

## Arquitetura

A XpeX Academy usa o LearnHouse como base técnica e preserva sua separação de responsabilidades:

| Camada | Caminho | Função |
|--------|---------|--------|
| Web | `apps/web` | Frontend Next.js para alunos, professores, admins, landing pages e experiências públicas. |
| API | `apps/api` | Backend FastAPI com autenticação, cursos, organizações, IA, pagamentos, analytics e integrações. |
| Collab | `apps/collab` | Servidor de colaboração em tempo real para edição e quadros colaborativos. |
| CLI | `apps/cli` | Ferramenta oficial LearnHouse para setup, desenvolvimento, deploy, logs, backup e manutenção. |
| Docker/Nginx | `Dockerfile`, `docker/` | Empacotamento full-stack e proxy para execução self-hosted. |
| Docs | `docs/` | Documentação técnica, estratégica e guias de operação. |

## Deploy recomendado

- **MVP visual / landing institucional:** pode usar Vercel para páginas públicas ou frontend demonstrativo, desde que o backend persistente seja tratado separadamente.
- **Plataforma completa:** recomenda-se Docker em Railway, Render, Fly.io, VPS ou infraestrutura equivalente, com PostgreSQL, Redis, storage persistente, domínio, e-mail transacional e JWT secret forte.
- **Desenvolvimento local:** use o fluxo original do LearnHouse:

```bash
npx learnhouse dev
```

- **Setup self-hosted oficial:**

```bash
npx learnhouse@latest setup
```

Consulte `docs/xpex/deploy-strategy.md` para a estratégia detalhada.

## Roadmap XpeX

1. **Fase 01 — Fundação, auditoria e rebranding seguro.**
2. **Fase 02 — Landing institucional XpeX Academy.**
3. **Fase 03 — Global Skills Hub.**
4. **Fase 04 — Trilhas XpeX.**
5. **Fase 05 — Hub de Ferramentas.**
6. **Fase 06 — Professor IA.**
7. **Fase 07 — Certificados e Portfólio.**
8. **Fase 08 — Jobs & Freelance Hub.**
9. **Fase 09 — Comunidade, Blog e XpeX TV.**
10. **Fase 10 — Marketplace, white-label e expansão global.**


## Fase 02 — Landing Premium

A Fase 02 adiciona a primeira landing pública premium da XpeX Academy na rota `/` do frontend `apps/web`, usando Next.js App Router. A página apresenta a proposta de valor, módulos estratégicos, jornada do aluno, FAQ e um CTA visual para lista de espera.

Os módulos exibidos — Global Skills Hub, Trilhas XpeX, Professor IA, Certificados, Portfólio, Comunidade, XpeX TV, Blog e Jobs & Freelance Hub — representam a visão estratégica e o roadmap do ecossistema. Integrações reais, IA operacional, pagamentos, marketplace, vagas/freelas e captura persistente de leads ficam para fases futuras.

A implementação preserva a atribuição ao LearnHouse, a licença AGPL-3.0 e não altera autenticação, banco de dados, migrações, permissões, pagamentos, API, Collab Server ou rotas internas como `/home`, `/login`, `/admin` e `/orgs`.

## Base técnica LearnHouse

LearnHouse é uma plataforma open-source para experiências de aprendizagem, com recursos como cursos, editor em blocos, coleções, assignments, discussões, podcasts, analytics, playgrounds, execução de código, boards colaborativos, IA, certificados, grupos de usuários, SEO, customização, pagamentos e SSO em edições apropriadas.

A documentação e os comandos originais continuam relevantes para desenvolvimento e operação:

- CLI: `apps/cli/README.md`
- Documentação local: `docs/`
- Projeto upstream: <https://github.com/learnhouse/learnhouse>
- Site upstream: <https://learnhouse.app>

## Segurança

A segurança deve continuar seguindo as práticas do projeto base. Não exponha secrets no repositório. Configure valores sensíveis por variáveis de ambiente, especialmente JWT secret, banco, Redis, provedores de e-mail, chaves de IA, storage e pagamentos.

Para referência de configuração sem secrets reais, consulte `.env.xpex.example`.

## Author & Maintainer upstream

Sweave (Badr B.) — [@swve](https://github.com/swve)

## Atribuição

Este fork usa LearnHouse como base técnica. As atribuições obrigatórias ao projeto original e a compatibilidade com upstream devem ser preservadas nas próximas fases.

## License

[AGPL-3.0](LICENSE) — Enterprise features are available under a separate Enterprise License.
