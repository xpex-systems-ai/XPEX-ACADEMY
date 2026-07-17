# Papéis e permissões

## Papéis atuais encontrados

- `ADMIN_ROLE_ID = 1`: acesso administrativo amplo, definido em `apps/api/src/security/rbac/constants.py`.
- `MAINTAINER_ROLE_ID = 2`: manutenção de conteúdo, definido em `apps/api/src/security/rbac/constants.py`.
- Papéis customizados por organização: `Role` possui `org_id`, `role_type` e `rights` em `apps/api/src/db/roles.py`.
- Associação usuário-organização: `UserOrganization` conecta `user_id`, `org_id` e `role_id` em `apps/api/src/db/user_organizations.py`.

## Papéis necessários para o piloto

| Persona | Papel recomendado | Permissões mínimas | Limites de acesso | Riscos |
|---|---|---|---|---|
| Aluno | Membro sem privilégios administrativos | Ler curso publicado/restrito, realizar atividades, enviar assignments, ver próprio progresso/certificado | Somente organização Kelle Digital Lab e recursos liberados à turma | Exposição cruzada se grupo/recurso for configurado errado |
| Professora Kelle | Maintainer ou custom role restrita | Ler alunos da turma, acompanhar progresso, organizar/liberar conteúdo, consultar submissions | Não deve ter administração global, billing, proxy, secrets ou outras organizações | Maintainer pode ser amplo demais; preferir custom role validada |
| Operador XpeX | Admin da organização ou superadmin operacional fora do dia a dia | Criar organização, curso, user group, vincular usuários e revisar configuração | Uso pontual; não operar como professora | Admin amplia impacto em caso de erro |

## Princípio de menor privilégio

1. Kelle Digital Lab deve ser isolado por `org_id`.
2. Turma piloto deve ser um `UserGroup` dentro da organização.
3. Conteúdo restrito deve ser liberado por user group quando aplicável.
4. A professora não deve receber permissões de billing, superadmin, proxy ou organizações não relacionadas.
5. Certificados devem usar texto de curso livre e não conter identidade acadêmica externa.

## Decisões pendentes

- Confirmar se `MAINTAINER_ROLE_ID` é aceitável para a professora ou se um `Role` customizado é obrigatório.
- Definir matriz exata de `rights` para professor/tutor do piloto.
- Validar se dashboards atuais permitem visão por user group/turma sem expor outros alunos da organização.
