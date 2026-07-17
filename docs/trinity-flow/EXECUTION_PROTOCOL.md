# Protocolo de execução XpeX Trinity Flow™

## 1. Planejamento pelo Architect

O Architect prepara o blueprint da missão com:

- Identificação da missão, objetivo e prioridade.
- Escopo permitido e proibido.
- Arquivos ou áreas autorizadas.
- Restrições de segurança, multi-tenancy, licença e upstream.
- Critérios de aceite, validações esperadas e plano de rollback.

## 2. Pesquisa pelo Researcher

O Researcher é acionado quando a missão depende de documentação oficial, comportamento de bibliotecas, padrões externos, APIs de terceiros ou decisões com incerteza técnica. A pesquisa deve registrar fontes e conclusões aplicáveis.

## 3. Execução pelo Codex

O Builder deve:

- Inspecionar o estado do repositório antes de editar.
- Confirmar branch e workspace limpo.
- Criar ou trocar para a branch da missão.
- Alterar somente o escopo autorizado.
- Preservar licença AGPL-3.0, atribuições LearnHouse e compatibilidade upstream.
- Não versionar secrets.
- Não instalar, atualizar ou remover dependências sem autorização explícita.

## 4. Branch por missão

Cada missão usa uma branch dedicada, preferencialmente no formato:

```text
<tipo>/<descrição-curta-da-missão>
```

Exemplo:

```text
docs/trinity-governance-foundation
```

Branches antigas, já integradas ou associadas a outra PR não devem ser reutilizadas.

## 5. Commit e Pull Request

- Use commits lógicos e mensagens convencionais quando aplicável.
- Abra Pull Request contra a branch base definida no blueprint.
- A PR deve declarar motivação, escopo, arquivos alterados, validações, riscos, itens fora de escopo e próxima missão.
- Nenhuma missão deve ser considerada concluída sem PR revisável, salvo orientação explícita em contrário.

## 6. Auditoria P0, P1, P2 e P3

- **P0:** falha crítica, vazamento, perda de dados ou comprometimento severo. Bloqueia merge.
- **P1:** risco alto de segurança, regressão ou quebra arquitetural. Bloqueia merge.
- **P2:** problema médio que deve ser corrigido ou formalmente aceito.
- **P3:** melhoria recomendada sem bloqueio imediato.

A auditoria deve revisar escopo, segurança, multi-tenancy, testes, documentação, licença, atribuição e impacto operacional.

## 7. Correções na mesma PR

Achados da auditoria devem ser corrigidos na mesma branch e PR para preservar rastreabilidade. Se uma correção exigir novo escopo, o Operador deve decidir entre ampliar formalmente a missão ou criar missão separada.

## 8. Merge somente após aprovação

Merge não é automático. Ele exige:

- Ausência de P0 e P1 abertos.
- P2 corrigidos ou aceitos formalmente.
- Validações documentadas.
- Aprovação humana registrada pelo Operador.

## 9. Deploy e validação pós-merge

Após merge autorizado, o deploy deve seguir o ambiente definido para a missão. A validação pós-merge deve registrar data, ambiente, commit, checks executados, resultado e qualquer rollback necessário.

## 10. Modelo de mensagem do Operador para auditoria GX

```text
GX, audite a missão abaixo seguindo severidades P0/P1/P2/P3.

Missão: <ID e nome>
Branch: <branch>
PR: <link>
Commit: <sha>
Resumo: <o que foi alterado>
Escopo autorizado: <resumo>
Fora de escopo confirmado: <itens não alterados>
Validações executadas:
- <comando/check>: <resultado>
Riscos conhecidos: <riscos ou "nenhum identificado">
Pontos que exigem atenção: <itens específicos>
Critério de aceite principal: <critério>

Solicito parecer para correção, aceite ou liberação de merge.
```
