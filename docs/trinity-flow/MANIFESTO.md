# Manifesto XpeX Trinity Flow™

## Visão do método

O XpeX Trinity Flow™ é o método oficial de planejamento, implementação, auditoria, correção, merge e validação da XpeX Academy. Ele existe para manter a evolução do fork LearnHouse incremental, segura, rastreável e compatível com a base upstream.

## Papéis

- **Architect — GX:** define arquitetura, blueprints, riscos, critérios de aceite e recomendações técnicas.
- **Builder — OpenAI Codex:** executa exclusivamente o blueprint autorizado, com mudanças versionadas e revisáveis.
- **Researcher — Copilot Edge:** pesquisa documentação oficial, valida hipóteses e apoia segunda análise técnica quando necessário.
- **Operador — Junior Sena:** coordena a missão, toma decisões finais, registra aprovações e garante supervisão humana.

## Princípios

1. **Planejar:** nenhuma implementação começa sem objetivo, escopo, restrições e critérios de aceite.
2. **Pesquisar:** dúvidas técnicas, dependências externas e decisões de arquitetura devem ser verificadas em fontes confiáveis.
3. **Executar:** o Builder altera somente os arquivos autorizados e evita mudanças oportunistas.
4. **Versionar:** cada missão usa branch própria, commit lógico e Pull Request revisável.
5. **Auditar:** toda PR deve ser avaliada por severidade P0, P1, P2 e P3.
6. **Corrigir:** achados da auditoria são tratados na mesma PR antes do merge, salvo aceite formal.
7. **Implantar:** deploy ocorre somente após aprovação humana e merge autorizado.
8. **Validar:** o resultado pós-merge deve ser conferido no ambiente adequado e registrado.

## Supervisão humana obrigatória

Agentes podem planejar, pesquisar, executar e auditar, mas não substituem a decisão humana. Merge, deploy produtivo, mudanças críticas e aceite de riscos exigem aprovação explícita do Operador.

## Execução incremental e auditável

O repositório deve evoluir por missões pequenas, com escopo fechado, validações reproduzíveis e histórico claro. Mudanças funcionais, documentais e infraestruturais devem ser separadas sempre que possível.

## Lema oficial

**Planejar com clareza. Executar com precisão. Auditar com rigor. Evoluir com segurança.**
