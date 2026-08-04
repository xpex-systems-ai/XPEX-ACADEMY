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

## Escopo inicial

A composição premium estreia somente em `/beta/aluno`. Professora e polo continuam no shell v1, preservando rotas, alternância de papéis e âncoras existentes.
