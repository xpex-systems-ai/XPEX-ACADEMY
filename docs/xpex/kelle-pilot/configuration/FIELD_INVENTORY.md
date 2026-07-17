# Kelle Pilot Configuration — Field Inventory

> MISSION-006. Inventário documental baseado no código atual. Não cria dados, seeds, migrations, usuários, organizações, cursos ou turmas.

## Regra de evidência

- Campos de banco vêm dos modelos `table=True`.
- Campos de entrada vêm de classes `*Create` e `*Update`.
- Campos calculados/serializados vêm de classes `*Read` ou serviços.
- Defaults só são declarados quando aparecem no código.

## Organization

| Campo | Origem | Tipo/default | Obrigatório | Risco | Evidência |
|---|---|---|---|---|---|
| `name` | Base/Create | `str` | Sim | Nome público deve seguir marca aprovada | `apps/api/src/db/organizations.py` |
| `description`, `about` | Base/Create/Update | `Optional[str] = None` | Não | Claims comerciais/acadêmicos indevidos | `apps/api/src/db/organizations.py` |
| `socials`, `links`, `scripts`, `previews` | Base/Create/Update | JSON dict com `default_factory=dict` | Não | `scripts` pode carregar terceiros; manter vazio no piloto | `apps/api/src/db/organizations.py` |
| `logo_image`, `thumbnail_image` | Base/Create/Update | `Optional[str] = None` | Não | Não usar identidade de faculdade | `apps/api/src/db/organizations.py` |
| `explore` | Base/Table | `Optional[bool] = False`, indexado | Não | Se `true`, aumenta descoberta pública | `apps/api/src/db/organizations.py` |
| `label` | Base/Create/Update | `Optional[str] = None` | Não | Rótulo público deve ser neutro | `apps/api/src/db/organizations.py` |
| `slug` | Base/Create/Update/Table | `str`, único e indexado | Sim | Colisão/URL pública | `apps/api/src/db/organizations.py` |
| `email` | Base/Create/Update | `str` | Sim | Não usar e-mail pessoal em exemplo | `apps/api/src/db/organizations.py` |
| `id`, `org_uuid`, `creation_date`, `update_date` | Table/Read | gerados/persistidos | Banco | Não usar IDs reais em docs | `apps/api/src/db/organizations.py` |
| `config` | Read/WithConfig | `OrganizationConfig` ou dict | Calculado | Configuração fora do escopo desta missão | `apps/api/src/db/organizations.py` |

## Role e UserOrganization

| Campo | Origem | Tipo/default | Obrigatório | Risco | Evidência |
|---|---|---|---|---|---|
| `Role.name` | Base/Create | `str` | Sim | Nome deve deixar claro que é candidato | `apps/api/src/db/roles.py` |
| `Role.description` | Base/Create/Update | `Optional[str] = None` | Não | Ambiguidade operacional | `apps/api/src/db/roles.py` |
| `Role.rights` | Base/Create/Update | JSON `Rights`/dict, `default_factory=dict` | Não no modelo; necessário operacionalmente | Privilégio excessivo | `apps/api/src/db/roles.py` |
| `Role.org_id` | Table/Create/Read | FK Organization opcional | Para role de organização | Isolamento por organização | `apps/api/src/db/roles.py` |
| `Role.role_type` | Table/Read | `TYPE_GLOBAL` default; enum inclui `TYPE_ORGANIZATION` e `TYPE_ORGANIZATION_API_TOKEN` | Não | Não usar API token para professora | `apps/api/src/db/roles.py` |
| `Role.role_uuid`, datas | Table/Read | `str` | Banco | Não usar UUID real | `apps/api/src/db/roles.py` |
| Buckets `Rights` | Schema | `courses`, `users`, `usergroups`, `folders`, `media`, `organizations`, `coursechapters`, `activities`, `assignments`, `roles`, `dashboard`, `communities`, `discussions`, `podcasts`, `boards`, `playgrounds` | Depende do bucket | Superfície ampla | `apps/api/src/db/roles.py` |
| `UserOrganization.user_id`, `org_id`, `role_id` | Table | FKs/indexados | Sim | Associação errada concede acesso | `apps/api/src/db/user_organizations.py` |
| `UserOrganization.creation_date`, `update_date` | Table | `str` | Sim | Auditoria | `apps/api/src/db/user_organizations.py` |
| Admin/Maintainer globais | Seed/constantes | Admin `1`; Maintainer `2` | Existente | Maintainer é amplo | `apps/api/src/security/rbac/constants.py`, `apps/api/src/services/setup/setup.py` |

## UserGroup, membros e recursos

| Campo | Origem | Tipo/default | Obrigatório | Risco | Evidência |
|---|---|---|---|---|---|
| `UserGroup.name`, `description` | Base/Create/Update | `str` | Sim | Não incluir dados pessoais | `apps/api/src/db/usergroups.py` |
| `UserGroup.org_id` | Table/Create/Read | FK Organization | Sim | Isolamento por organização | `apps/api/src/db/usergroups.py` |
| `UserGroup.usergroup_uuid`, datas | Table/Read | `str` | Banco | Não usar UUID real | `apps/api/src/db/usergroups.py` |
| `UserGroupUser.usergroup_id`, `user_id`, `org_id` | Table | FKs | Sim | Matrícula indevida | `apps/api/src/db/usergroup_user.py` |
| `UserGroupResource.usergroup_id`, `resource_uuid`, `org_id` | Table | FK + uuid do recurso | Sim | Recurso errado libera conteúdo | `apps/api/src/db/usergroup_resources.py` |

## Course, Chapter e Activity

| Campo | Origem | Tipo/default | Obrigatório | Risco | Evidência |
|---|---|---|---|---|---|
| `Course.name` | Base/Create | `str` | Sim | Nome deve incluir curso livre sem claims acadêmicos | `apps/api/src/db/courses/courses.py` |
| `Course.description`, `about`, `learnings`, `tags` | Base/Create/Update | `Optional[str] = None` | Não | Claims proibidos | `apps/api/src/db/courses/courses.py` |
| `thumbnail_type` | Base/Create/Table | enum `image`, `video`, `both`; default `image` | Não | Mídia não aprovada | `apps/api/src/db/courses/courses.py` |
| `thumbnail_image`, `thumbnail_video` | Base/Create | `Optional[str] = ""` | Não | Branding externo | `apps/api/src/db/courses/courses.py` |
| `public` | Base/Create/Update | `bool` sem default | Sim | Exposição pública acidental | `apps/api/src/db/courses/courses.py` |
| `published` | Base/Create/Update | `bool = False` | Não | Publicação prematura | `apps/api/src/db/courses/courses.py` |
| `open_to_contributors` | Base/Create/Update | `bool` sem default | Sim | Colaboração indevida | `apps/api/src/db/courses/courses.py` |
| `org_id`, `course_uuid`, datas | Table/Read | FK, uuid, datas | Banco | Isolamento | `apps/api/src/db/courses/courses.py` |
| `seo`, `extra_metadata` | Table/Create/Update/Read | JSONB opcional | Não | SEO público; metadados não devem virar contrato de seed | `apps/api/src/db/courses/courses.py` |
| `Chapter.name`, `description`, `thumbnail_image` | Base/Create/Update | `str`, opcionais com `""` | Nome sim | Ordem/metodologia só documental | `apps/api/src/db/courses/chapters.py` |
| `Chapter.lock_type` | Base/Update | `public` default; `authenticated`; `restricted` | Não | Deve ser `restricted` para turma | `apps/api/src/db/courses/chapters.py` |
| `Chapter.org_id`, `course_id`, `chapter_uuid`, `extra_metadata` | Base/Table/Create/Read | FKs, uuid, JSONB | Sim/Banco | NAVE IA via metadados | `apps/api/src/db/courses/chapters.py` |
| `Activity.name`, `activity_type`, `activity_sub_type` | Base/Create/Update | enums; create default `TYPE_CUSTOM`/`SUBTYPE_CUSTOM` | Sim | Tipo incompatível | `apps/api/src/db/courses/activities.py` |
| `Activity.content`, `details` | Base/Create/Update | JSON dict/default `{}`; details opcional | Não | Conteúdo real fora do escopo | `apps/api/src/db/courses/activities.py` |
| `Activity.published`, `lock_type` | Base/Update | `False`; `public` default | Não | Atividade exposta antes da turma | `apps/api/src/db/courses/activities.py` |
| `Activity.org_id`, `course_id`, `activity_uuid`, `extra_metadata`, versioning | Table/Read | FKs, uuid, JSONB, `current_version=1` | Banco | Auditoria/isolamento | `apps/api/src/db/courses/activities.py` |

## Assignments, progresso e certificado

| Campo | Origem | Tipo/default | Obrigatório | Risco | Evidência |
|---|---|---|---|---|---|
| Assignment base | Base/Create | `title`, `description`, `due_date`, `grading_type`, `org_id`, `course_id`, `chapter_id`, `activity_id` | Sim | Datas/carga horária reais não aprovadas | `apps/api/src/db/courses/assignments.py` |
| Assignment flags | Base/Update | `published=False`, `auto_grading=False`, `anti_copy_paste=False`, `show_correct_answers=False`, `allow_retries=False`, `max_retries=0` | Não | Gabaritos/tentativas | `apps/api/src/db/courses/assignments.py` |
| Assignment task | Base/Create | `title`, `description`, `hint`, `assignment_type`, `contents`, `max_grade_value=100` | Sim | Uploads e dados pessoais | `apps/api/src/db/courses/assignments.py` |
| `Trail` | Table/Create/Read | `org_id`, `user_id`, `trail_uuid`, datas, runs | Sim/Banco | Progresso por usuário | `apps/api/src/db/trails.py` |
| `TrailRun` | Table/Create/Read | `data={}`, `status=STATUS_IN_PROGRESS`, `trail_id`, `course_id`, `org_id`, `user_id`, datas | Sim | Curso concluído indevidamente | `apps/api/src/db/trail_runs.py` |
| `TrailStep` | Table | `complete`, `teacher_verified`, `grade`, `data={}`, FKs, datas | Sim | Pode disparar certificado se todas atividades concluídas | `apps/api/src/db/trail_steps.py` |
| `Certifications` | Table/Create/Update | `course_id`, `config={}`, `certification_uuid`, datas | Sim/Banco | Texto inadequado vira certificado | `apps/api/src/db/courses/certifications.py` |
| `CertificateUser` | Table/Create/Read | `user_id`, `certification_id`, `user_certification_uuid`, datas | Sim/Banco | Emissão para pessoa errada | `apps/api/src/db/courses/certifications.py` |
| Emissão automática | Serviço | cria `CertificateUser` quando todas as atividades do curso têm `TrailStep.complete=True` e existe certificação | Calculado | Certificado prematuro | `apps/api/src/services/courses/certifications.py` |

## Inferências operacionais marcadas

1. Slug reservado recomendado: `kelle-digital-lab`, derivado do nome aprovado e do requisito de slug único.
2. Curso piloto deve iniciar `public=false`, `published=false`, `open_to_contributors=false`, com chapters/activities `lock_type=restricted` e liberação por `UserGroupResource` apenas quando validado.
3. Maintainer global é amplo demais para professora no piloto porque inclui criação/edição/exclusão de cursos, grupos, mídia, comunidades, podcasts, boards e playgrounds.
