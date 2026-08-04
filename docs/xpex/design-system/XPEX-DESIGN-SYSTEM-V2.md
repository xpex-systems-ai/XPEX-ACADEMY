# XpeX Design System v2 — Premium Visual Foundation

## Direção

A v2 combina superfícies dark controladas, energia laranja para ações e ciano/azul para inteligência e progresso. A hierarquia educacional deve preceder efeitos decorativos; todo conteúdo desta experiência beta permanece explicitamente fictício.

## Tokens

Os tokens CSS `--xpex-*` em `xpex.css` são a fonte para fundos, superfícies, texto, bordas, cores de energia e raios (12, 18, 24 e 32 px). Cards usam sombra suave; glows são ambientais, têm baixo contraste e nunca comunicam estado sozinhos.

## Primitives

- `XpexHero` e `XpexSectionHeader`: hierarquia de página e seção.
- `XpexPanel`, `XpexMetricCard`, `XpexFeatureCard` e `XpexActionCard`: superfícies reutilizáveis.
- `XpexProgressBar` e `XpexStatusBadge`: progresso e estado com texto acessível.
- `XpexAmbientGlow`: decoração marcada como não semântica.

## Acessibilidade e movimento

Ações mantêm foco visível, progresso usa atributos ARIA e a navegação oferece skip link. Layouts partem de mobile e ganham colunas progressivamente. Transições são pequenas e `prefers-reduced-motion` reduz animação e movimento.

## Experiências por papel

A composição premium atende `/beta/aluno`, `/beta/professora` e `/beta/polo`. Cada papel possui uma experiência isolada, enquanto o `BetaShell` se limita a selecionar a experiência e envolvê-la no shell compartilhado.

- **Aluno:** continuidade da aprendizagem, trilha, projeto e comunidade.
- **Professora:** liderança pedagógica, pulso da turma, prioridade de feedback e preparação de mentorias.
- **Polo:** presença educacional local, operação piloto, agenda comunitária e ativação do laboratório.

Professora e polo reutilizam a mesma hierarquia de hero, seções, painéis, indicadores, progresso e ações. Laranja destaca prioridades e ações; ciano identifica contexto, inteligência e progresso. As diferenças entre os papéis vêm da hierarquia de informação, não de uma linguagem visual paralela.

## Transparência de demonstração

Indicadores, participantes, turmas, projetos, eventos e ações precisam trazer contexto explícito de ficção, demonstração ou piloto. Botões das experiências beta são demonstrativos, não consultam backend e não persistem ações. A experiência de polo também evita alegações financeiras, de matrícula, parceria ou resultado oficial.

## Landing pública premium

A rota pública `/` também deve consumir a identidade Premium v2: fundo `#02050B`, superfícies `#081321`/`#0E1E30`, ações em `#FF6A00`/`#FF8A2A` e azul/ciano `#087CFF`/`#16D9FF` para inteligência, navegação e progresso. A landing não deve retomar o sistema legado amarelo/dourado.

A narrativa pública conecta cedo as três experiências beta (`/beta/aluno`, `/beta/professora` e `/beta/polo`) e apresenta o curso piloto `XPEX-PILOT-01 — Primeiros Passos com IA` como jornada demonstrativa. Conteúdos de roadmap precisam continuar identificados como futuros ou planejados, Professor IA deve ser descrito como apoio e não substituição da professora, e formulários visuais sem backend não devem aparecer.

A seção de transparência pública precisa preservar a atribuição à base open-source LearnHouse e à licença AGPL-3.0, além de declarar que dashboards beta usam dados fictícios, não persistem informações reais e não implicam integrações ativas com terceiros, matrículas reais, resultados financeiros ou certificações externas.
