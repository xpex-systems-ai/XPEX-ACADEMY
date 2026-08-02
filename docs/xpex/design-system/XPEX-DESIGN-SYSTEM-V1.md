# XpeX Design System v1

## Fundamentos

O sistema visual apresenta a camada XpeX sem substituir o motor LearnHouse. A base usa preto azulado (`#02050B`), superfícies `#081321`/`#0E1E30`, laranja XpeX (`#FF6A00`), azul elétrico (`#087CFF`), ciano (`#16D9FF`) e texto de alto contraste. A tipografia permanece no stack local já configurado, sem fontes remotas.

## Componentes

- `XpexAppShell`: layout responsivo, skip link, topbar, navegação por papel e drawer móvel.
- `XpexPrimitives`: badge, painel, métrica, progresso, ação e estados vazio/carregamento/erro.
- `xpex-navigation.ts`: navegação tipada e específica para aluno, professora e polo.
- `BetaShell`: composição dos dados demonstrativos nas primitives; não contém fetch, sessão ou persistência.

## Uso

Os dashboards devem usar `XpexAppShell` e as primitives em vez de duplicar cards. Laranja representa ação/energia; azul e ciano representam inteligência, progresso e contexto. Glows são decorativos, discretos e nunca carregam informação.

Todo valor simulado deve estar próximo de um dos rótulos “Preview Beta”, “Dados fictícios”, “Demonstração” ou “Ambiente de apresentação”. Não usar logos tecnológicos como parceria, números sem fonte, certificação externa ou fotografia pessoal não autorizada.

## Responsividade e acessibilidade

- A sidebar é persistente a partir de `lg` e vira drawer com overlay/controles nomeados em telas menores.
- Grids colapsam para uma coluna em celular, duas em tablet e até quatro em desktop.
- O shell inclui skip link, landmarks, foco visível, labels de botões icon-only e progressbars semânticas.
- `prefers-reduced-motion` reduz animações e transições globalmente dentro da experiência.
- Contraste, headings sequenciais e conteúdo textual preservam entendimento sem depender de cor ou imagem.

## Limites desta versão

A v1 é uma camada demonstrativa isolada. Autenticação, cursos, progresso, analytics, organizações e IA reais continuam no LearnHouse e serão conectados somente em missão posterior, com autorização e contratos de dados definidos.

