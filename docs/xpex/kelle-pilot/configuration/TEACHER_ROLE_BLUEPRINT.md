# Teacher Role Blueprint — Professora Kelle

## Decisão documental

A professora deve usar **custom role de organização** com menor privilégio. O papel global `Maintainer` deve permanecer como fallback de validação técnica, não como recomendação operacional inicial.

## Buckets de `Role.rights`

O schema atual aceita buckets: `courses`, `users`, `usergroups`, `folders`, `media`, `organizations`, `coursechapters`, `activities`, `assignments`, `roles`, `dashboard`, `communities`, `discussions`, `podcasts`, `boards` e `playgrounds`.

## Matriz candidata

| Bucket | Permitido candidato | Negado candidato | Observação |
|---|---|---|---|
| `dashboard` | `action_access=true` | — | Necessário se a professora usar dashboard |
| `courses` | `read=true`, `read_own=true`, talvez `update_own=true` | `delete=false`; `create=false` até validação | Edição só de curso atribuído |
| `coursechapters` | `read=true`, talvez `update=true` | `delete=false`, `create=false` até missão curricular | Operador cria estrutura inicial |
| `activities` | `read=true`, talvez `update=true` | `delete=false`, `create=false` até missão curricular | Publicação passa por checklist |
| `assignments` | `read=true`, `update=true` para avaliação | `delete=false`; `create=false` até validação | `update` pode representar grading |
| `users` | `read=true` | `create/update/delete=false` | Consultar alunos; operador gerencia cadastro |
| `usergroups` | `read=true` | `create/update/delete=false` | Turma gerida pelo operador |
| `media`, `folders` | `read=true`; `create` pendente | `delete=false` | Upload exige política de mídia |
| `organizations` | `read=true` | `create/update/delete=false` | Sem alterar tenant |
| `roles` | `read=false` ou `read=true` apenas se dashboard exigir | `create/update/delete=false` | Sem gestão de papéis |
| `certifications` | Não há bucket dedicado no schema `Rights` | — | Serviços usam acesso ao curso; aprovação fica com operador |
| `communities`, `discussions`, `podcasts`, `boards`, `playgrounds` | `read` somente se usado | `create/update/delete=false` inicialmente | Fora do MVP inicial |

## Por que Maintainer é amplo demais

O seed de `Maintainer` concede criação, leitura, atualização e exclusão em cursos, usergroups, folders, media, chapters, activities, assignments, communities, discussions, podcasts, boards e playgrounds. Isso excede a necessidade inicial de acompanhar uma turma e revisar submissions.


## Criação de role no código atual

`RoleCreate` aceita `name`, `description`, `rights` e `org_id`; ele não aceita `role_type` diretamente no payload de criação. No serviço de criação, o fluxo valida `org_id` e força roles criadas por usuários para `RoleTypeEnum.TYPE_ORGANIZATION`. Portanto, o exemplo documental não deve enviar `role_type`; o tipo deve ser definido pelo fluxo/serviço organizacional correspondente, sem presumir endpoint ou comportamento além do código existente.

## JSON candidato documental

```json
{
  "notice": "EXEMPLO DOCUMENTAL — NÃO EXECUTAR EM PRODUÇÃO.",
  "name": "Kelle Pilot Teacher Candidate",
  "org_id": "<ORG_ID_DA_KELLE_DIGITAL_LAB>",
  "rights": {
    "courses": {"action_create": false, "action_read": true, "action_read_own": true, "action_update": false, "action_update_own": true, "action_delete": false, "action_delete_own": false},
    "users": {"action_create": false, "action_read": true, "action_update": false, "action_delete": false},
    "usergroups": {"action_create": false, "action_read": true, "action_update": false, "action_delete": false},
    "folders": {"action_create": false, "action_read": true, "action_update": false, "action_delete": false},
    "media": {"action_create": false, "action_read": true, "action_update": false, "action_delete": false},
    "organizations": {"action_create": false, "action_read": true, "action_update": false, "action_delete": false},
    "coursechapters": {"action_create": false, "action_read": true, "action_update": true, "action_delete": false},
    "activities": {"action_create": false, "action_read": true, "action_update": true, "action_delete": false},
    "assignments": {"action_create": false, "action_read": true, "action_update": true, "action_delete": false},
    "roles": {"action_create": false, "action_read": false, "action_update": false, "action_delete": false},
    "dashboard": {"action_access": true},
    "communities": {"action_create": false, "action_read": false, "action_update": false, "action_delete": false},
    "discussions": {"action_create": false, "action_read": true, "action_read_own": true, "action_update": false, "action_update_own": false, "action_delete": false, "action_delete_own": false},
    "podcasts": {"action_create": false, "action_read": false, "action_read_own": false, "action_update": false, "action_update_own": false, "action_delete": false, "action_delete_own": false},
    "boards": {"action_create": false, "action_read": false, "action_read_own": false, "action_update": false, "action_update_own": false, "action_delete": false, "action_delete_own": false},
    "playgrounds": {"action_create": false, "action_read": false, "action_read_own": false, "action_update": false, "action_update_own": false, "action_delete": false, "action_delete_own": false}
  }
}
```

## Ações exclusivas do operador XpeX

- Criar organização, turma, curso, chapters, activities e assignments iniciais.
- Associar estudantes e recursos ao user group.
- Alterar `public`, `published`, `lock_type`, papéis e certificado.
- Aprovar wording público e certificado.
