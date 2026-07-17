# Kelle Pilot Configuration Blueprint

MISSION-006 define a configuração operacional documental do primeiro piloto **Kelle Digital Lab** antes de qualquer criação de dados reais.

## Escopo confirmado

- Sem alteração funcional.
- Sem seed executável.
- Sem migration.
- Sem dependências ou lockfiles.
- Sem usuários, organizações, cursos ou turmas reais.
- Curso tratado como **curso livre** e **projeto educacional independente**.

## Documentos

- [Field Inventory](FIELD_INVENTORY.md)
- [Organization Blueprint](ORGANIZATION_BLUEPRINT.md)
- [Teacher Role Blueprint](TEACHER_ROLE_BLUEPRINT.md)
- [Class Group Blueprint](CLASS_GROUP_BLUEPRINT.md)
- [Course Blueprint](COURSE_BLUEPRINT.md)
- [Access and Publication Policy](ACCESS_AND_PUBLICATION_POLICY.md)
- [Certificate Policy](CERTIFICATE_POLICY.md)
- [Activation Checklist](ACTIVATION_CHECKLIST.md)
- [Documental JSON example](pilot.example.json)

## Configuração principal

| Domínio | Decisão |
|---|---|
| Organização | `Kelle Digital Lab` como `Organization` |
| Turma | `Turma Piloto 01` como `UserGroup` |
| Curso | `Informática Básica com Inteligência Artificial` como `Course` privado |
| Metodologia | NAVE IA em `Chapter.extra_metadata`/`Course.extra_metadata` |
| Aulas | `Activity` |
| Práticas | `Assignment` |
| Progresso | `TrailRun` e `TrailStep` |
| Certificado | `Certifications` e `CertificateUser`, com wording de curso livre |

## Evidência revisada

Foram revisados modelos e serviços em `apps/api/src/db`, `apps/api/src/services`, `apps/api/src/security/rbac` e documentos MISSION-004/MISSION-005. O inventário de campos cita os arquivos de origem.
