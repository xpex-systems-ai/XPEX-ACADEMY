# XPeX Learning Operating System AI

> **Aprenda. Crie. Publique. Monetize.**

## Visão

A XPeX Academy evolui de uma LMS tradicional para um **Learning Operating System AI**: uma camada operacional de aprendizagem que conecta conteúdo, IA, prática, projetos, publicação e oportunidade em uma única jornada.

A definição oficial é:

> **Um sistema operacional de aprendizagem com IA que transforma conhecimento em habilidade, habilidade em projeto, projeto em ativo e ativo em oportunidade.**

Isso não significa declarar capacidades inexistentes. A regra de produto é simples: **só promover como operacional aquilo que estiver provado por código, dados, CI e testes em produção**.

## Ciclo central

```text
APRENDA -> CRIE -> PUBLIQUE -> MONETIZE -> MEÇA -> EVOLUA
```

### APRENDA

Cursos, aulas, atividades, trilhas, comunidade e acompanhamento formam a base educacional.

### CRIE

O XPeX AI Lab transforma aprendizado em prática. O aluno trabalha com projetos, prompts, RAG, automações, mídia, agentes e outros artefatos conforme cada capacidade for efetivamente habilitada.

### PUBLIQUE

Projetos validados podem evoluir para deploy, portfólio, entrega para cliente, distribuição interna ou publicação em integrações autorizadas.

### MONETIZE

A camada econômica é construída sobre capacidades comprovadas: venda de cursos, serviços, produtos digitais, marketplace, afiliados, revenue share e, futuramente, agentes executores.

### MEÇA E EVOLUA

Analytics, progresso, evidências de projeto e feedback do GX fecham o ciclo e orientam a próxima etapa da jornada.

## Arquitetura conceitual

```text
Pessoa / Aluno
      |
      v
XPeX Student Enterprise
      |
      +--> Cursos / Aulas / Atividades
      +--> Trilhas / Comunidade / Certificados
      +--> Learning Dashboard
      |
      v
XPeX AI Lab
      |
      +--> GX Mentor / Copilot / RAG
      +--> Workspace de Projetos
      +--> Playgrounds / Sandboxes (quando autorizados)
      +--> Ferramentas especializadas
      |
      v
XPeX Core
      |
      +--> Auth / Sessão
      +--> Organizações / Polos / RBAC
      +--> Matrículas / Progresso
      +--> Conteúdo / Mídia / Library
      +--> Comunidade / Trails / Analytics
      +--> IA / RAG / Providers
      +--> Pagamentos / Marketplace (quando habilitados)
      |
      v
Publicação / Mercado / Oportunidades
```

## Camadas de produto

### 1. XPeX Core

Motor técnico compartilhado. Responsável por autenticação, organizações, permissões, cursos, matrículas, progresso, mídia, comunidade, trilhas, analytics e integrações.

### 2. Polo Enterprise

Camada de operação para professor, administrador, escola ou empresa. O Polo Kelle Digital Lab é a implementação de referência validada e permanece com branding próprio.

O princípio multi-Polo é:

```text
XPeX Core -> Template de Polo -> Branding da organização -> Operação acadêmica
```

### 3. Student Enterprise

Experiência do aluno: início, cursos, atividades, trilhas, AI Lab, comunidade, certificados e progresso.

### 4. AI Lab

Camada de prática e construção. O laboratório deve reduzir a distância entre aprender e produzir.

O AI Lab não deve ser um catálogo de botões falsos. Cada módulo deve estar em um destes estados:

- **Operacional** — backend, permissões, UX e persistência comprovados;
- **Controlado** — interface existe, mas a capacidade depende de provider, quota, rota ou integração ainda não habilitada;
- **Roadmap** — visão futura, explicitamente marcada como tal.

## GX como camada de orquestração

A visão do GX é evoluir de chatbot para **mentor contextual e orquestrador da jornada**.

O GX pode, quando tecnicamente autorizado:

1. entender o curso e o progresso do aluno;
2. recuperar conteúdo autorizado via RAG;
3. sugerir o próximo passo;
4. orientar um projeto;
5. acionar ferramentas disponíveis;
6. revisar evidências;
7. recomendar publicação ou aprofundamento.

Exemplo futuro de missão:

```text
Objetivo: criar um negócio digital
  1. aprender fundamentos
  2. definir oferta
  3. criar identidade
  4. construir página
  5. produzir mídia
  6. publicar
  7. medir
  8. monetizar
```

## Learning Graph

A evolução natural do sistema é tratar aprendizagem como um grafo de relações entre:

- pessoa;
- organização;
- curso;
- aula;
- competência;
- projeto;
- evidência;
- trilha;
- objetivo;
- progresso;
- oportunidade.

A meta não é medir apenas horas assistidas, mas também **o que foi compreendido, construído, demonstrado e publicado**.

## Project OS

Todo aprendizado relevante deve poder terminar em um artefato demonstrável.

Exemplos:

- curso de sites -> site publicado;
- curso de vídeo -> peça de campanha;
- curso de automação -> workflow validado;
- curso de agentes -> agente testado;
- curso de RAG -> base de conhecimento demonstrável.

Projetos devem carregar evidências, critérios e estado real; nunca devem ser marcados como concluídos apenas por decoração de interface.

## Skill Passport

Direção futura: um perfil de competências baseado em evidências reais, combinando:

- cursos concluídos;
- projetos entregues;
- habilidades demonstradas;
- certificados;
- histórico de evolução;
- portfólio.

## Creator Economy e Agent Economy

A camada econômica deve nascer depois da camada de aprendizagem e criação estar comprovada.

Direção de evolução:

```text
Humano aprende
   -> humano constrói
   -> projeto é publicado
   -> projeto gera valor
   -> criador monetiza
```

Para agentes:

```text
Humano aprende
   -> cria agente
   -> testa em ambiente controlado
   -> publica
   -> agente executa tarefa
   -> criador recebe conforme regras da plataforma
```

Isso é direção de produto, não promessa de capacidade já disponível.

## Multi-Polo e Enterprise Learning

O mesmo Core pode servir:

- polos educacionais;
- professores independentes;
- escolas;
- empresas;
- academias corporativas;
- programas de capacitação.

Cada tenant pode possuir identidade, cursos, alunos e políticas próprias, preservando separação de dados e permissões.

## Marketplace, afiliados e integrações comerciais

Marketplace, pagamentos, afiliados e integrações externas só entram como **operacionais** depois de validação técnica específica.

A existência de código legado, endpoint ou integração declarada fora deste documento não é suficiente para marcar a capacidade como pronta.

Antes de ativar monetização em produção, validar no mínimo:

- identidade da organização;
- catálogo e oferta;
- pagamento/commissionamento;
- autorização e escopo da integração;
- idempotência;
- logs e reconciliação;
- política de erro e rollback;
- compliance aplicável.

## Segurança e confiança

A XPeX não promete segurança absoluta. A meta é engenharia defensiva contínua.

Princípios:

- least privilege;
- RBAC e tenant awareness;
- secrets fora do repositório;
- isolamento por organização;
- autorização server-side;
- estados controlados quando providers falham;
- sem métricas fictícias;
- sem links para capacidades inexistentes;
- logs e observabilidade;
- CI antes de merge;
- rollback claro;
- revisão de integrações antes de escalar.

## Estado de verdade

### Comprovado na baseline atual

- autenticação e sessão;
- organizações/Polo;
- gestão de cursos e conteúdo;
- convite/cadastro de aluno;
- matrícula acadêmica;
- learning dashboard;
- acesso do aluno ao curso;
- atividades e progresso;
- AI Lab e workspace de projetos;
- sessões de RAG e transporte do chat;
- comunidade, trilhas e certificados em rotas do Student Enterprise;
- analytics e eventos básicos;
- branding por Polo.

### Bloqueios e resíduos conhecidos

- provider de IA/embeddings ainda pode depender de configuração de chaves e quota;
- algumas mídias e thumbnails legadas podem retornar 404;
- alguns deep-links de módulos upstream ainda exigem normalização tenant-aware;
- Playgrounds ainda requerem fechamento de autorização/UX antes de exposição plena;
- pagamentos e marketplace não são tratados como prontos até E2E específico.

## Roadmap de transformação

### Fase A — Foundation Truth

- congelar baselines estáveis;
- corrigir rotas e estados quebrados;
- remover claims não provados;
- fechar observabilidade e autorização.

### Fase B — AI Brain

- ativar provider de LLM;
- ativar embeddings;
- validar RAG com conteúdo autorizado;
- implementar quotas, timeout, fallback e custos;
- testar E2E `aluno -> pergunta -> GX -> resposta fundamentada`.

### Fase C — Creation Studios

Evoluir módulos um por vez:

- Sites;
- Landing Pages;
- Apps;
- Agentes;
- Automação;
- Imagens;
- Vídeos;
- Música;
- E-books;
- Chatbots.

Cada Studio nasce com contrato de entrada, provider, persistência, ACL, observabilidade, custos e saída demonstrável.

### Fase D — Publish Layer

- GitHub;
- deploy;
- portfólio;
- exportação;
- publicação controlada;
- histórico de entregas.

### Fase E — Economy Layer

- ofertas e pagamentos;
- marketplace;
- afiliados;
- créditos/quota;
- revenue share;
- Agent Economy.

## Regra de execução

```text
IDEIA
  -> contrato
  -> implementação pequena
  -> CI
  -> revisão
  -> produção
  -> navegação real
  -> logs
  -> evidência
  -> freeze
  -> próxima camada
```

Esse fluxo existe para impedir que visão e marketing avancem mais rápido que a tecnologia.

## Norte

A XPeX não deve crescer como uma coleção de páginas.

Deve crescer como uma máquina integrada em que:

> educação vira habilidade, habilidade vira projeto, projeto vira ativo e ativo vira oportunidade.

**XPeX Learning Operating System AI**

**Aprenda. Crie. Publique. Monetize.**
