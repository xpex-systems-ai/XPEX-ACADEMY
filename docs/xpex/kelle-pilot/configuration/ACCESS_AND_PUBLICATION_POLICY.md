# Access and Publication Policy

## Política inicial

| Recurso | Estado inicial | Liberação futura |
|---|---|---|
| Organization | `explore=false` | Somente após revisão de marca/compliance |
| Course | `public=false`, `published=false` | Publicar apenas para turma validada |
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
- Admin/Maintainer bypassam locks no serviço; isso reforça a necessidade de custom role para operação diária.

## Sequência segura

1. Criar recursos com `published=false` e `restricted`.
2. Vincular recursos ao user group.
3. Testar aluno dentro da turma.
4. Testar usuário autenticado fora da turma.
5. Só então publicar atividades específicas.
