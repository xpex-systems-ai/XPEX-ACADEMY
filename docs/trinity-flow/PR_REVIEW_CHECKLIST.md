# Checklist obrigatório de Pull Request

Use este checklist antes de qualquer merge na XpeX Academy.

## Escopo e arquitetura

- [ ] O escopo autorizado foi respeitado.
- [ ] Não há mudanças fora da missão.
- [ ] A arquitetura existente foi preservada.
- [ ] O impacto multi-tenant foi avaliado quando aplicável.
- [ ] Áreas críticas não foram alteradas sem autorização explícita.

## Segurança e compliance

- [ ] Nenhum secret, token, chave ou credencial real foi adicionado.
- [ ] A licença AGPL-3.0 foi preservada.
- [ ] As atribuições ao LearnHouse foram preservadas.
- [ ] Não houve alteração de autenticação, autorização, RBAC ou permissões sem autorização.
- [ ] Não houve alteração de pagamentos, webhooks, banco, migrações ou infraestrutura sem autorização.

## Código, documentação e consistência

- [ ] Código e documentação estão consistentes entre si.
- [ ] A documentação operacional foi atualizada quando necessário.
- [ ] Não há alteração de lockfiles ou dependências sem autorização.
- [ ] Não há arquivos gerados, temporários ou caches versionados por engano.

## Testes e validação

- [ ] Testes relevantes foram executados ou a não execução foi justificada.
- [ ] Build ou validação equivalente foi documentada.
- [ ] `git diff --check` não reporta erros.
- [ ] Arquivos estruturados, como JSON, foram validados.

## Auditoria e aprovação

- [ ] Não há P0 aberto.
- [ ] Não há P1 aberto.
- [ ] P2 foram corrigidos ou formalmente aceitos.
- [ ] P3 foram registrados quando aplicável.
- [ ] Aprovação humana do Operador foi registrada antes do merge.
