# Access and Publication Policy

## Política inicial

| Recurso | Estado inicial | Liberação futura |
|---|---|---|
| Organization | `explore=false` | Somente após revisão de marca/compliance |
| Course | `public=false`, `published=false` | Alterar `published=true` somente em ambiente controlado e manter `public=false` para o piloto privado |
| Chapters | `lock_type=restricted` | Vincular por `UserGroupResource` |
| Activities | `published=false`, `lock_type=restricted` | Publicar por aula conforme checklist |
| Assignments | `published=false` | Liberar por atividade e critérios aprovados |
| Certificate | config criada apenas após wording aprovado | Emissão só após teste de conclusão |

## Matriz de acesso

| Persona | Pode | Não pode |
|---|---|---|
| Anônimo | Ver nada do curso privado | Curso, turma, progresso, certificado privado |
| Aluno | Ler curso/atividades publicadas e vinculadas à turma; enviar próprias submissions; ver próprio progresso/certificado | Editar conteúdo, turma, papéis, certificado, outros alunos |
| Professora | Acessar org autorizada; consultar turma/submissions; atualizar conteúdo atribuído se role aprovada | Billing, domains, secrets, superadmin, outras organizações, papéis |
| Operador | Configurar organização, turma, curso, vínculos, publicação e certificado | Criar dados reais sem missão/aprovação |

## Locks

- `public`: acessível inclusive anonimamente; não recomendado para piloto privado.
- `authenticated`: exige login, mas não garante turma.
- `restricted`: exige `UserGroupResource` e pertencimento em `UserGroupUser`; recomendado para turma piloto.
- No RBAC atual, recursos que possuem campo `published` só devem conceder acesso via `UserGroupResource` quando também estiverem `published=true`; o vínculo de turma não deve ser tratado como publicação por si só.
- Admin/Maintainer bypassam locks no serviço; isso reforça a necessidade de custom role para operação diária.

## Sequência segura

1. Criar o Course com `public=false` e `published=false`.
2. Criar Chapters e Activities com `lock_type=restricted`.
3. Vincular os recursos ao UserGroup por `UserGroupResource`.
4. Validar os vínculos de `UserGroupResource` e `org_id` antes de publicar qualquer recurso.
5. Alterar `published=true` somente em ambiente controlado.
6. Manter `public=false` durante todo o piloto privado.
7. Testar aluno dentro da turma.
8. Testar usuário autenticado fora da turma.
9. Testar acesso anônimo bloqueado.
