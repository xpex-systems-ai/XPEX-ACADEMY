# Gap Analysis — Learning Core

## Pronto para reutilizar

- Organization/UserOrganization como isolamento operacional.
- Role/RBAC como autorização.
- Course/Chapter/Activity como estrutura curricular.
- UserGroup/UserGroupResource/UserGroupUser como turma e controle de acesso.
- Trail/TrailRun/TrailStep como enrollment/progresso operacional.
- Certifications/CertificateUser como base de certificado.
- Storage/media existente para conteúdos.

## Precisa adaptar

| Prioridade | Item | Dependências | Motivo |
|---|---|---|---|
| P0 | Preset de professora com menor privilégio | Role.rights/RBAC | Evitar admin amplo no piloto |
| P0 | Política de curso livre/certificado | Certifications, conteúdo jurídico | Evitar claim acadêmico indevido |
| P1 | Checklist de publicação e acesso privado | Course.public/published, UserGroupResource | Evitar exposição pública acidental |
| P1 | Critérios de conclusão | TrailStep, Assignment | Definir se basta atividade concluída ou avaliação |
| P2 | Relatórios de turma | Analytics/Trail | Dashboards atuais podem não responder presença/portfólio |

## Precisa construir

- Entidade ou convenção formal de cohort/turma com calendário, se UserGroup não bastar.
- Presença/frequência e diário de classe.
- Portfólio consolidado do aluno.
- Revogação/correção de certificado com auditoria.
- Notificações pedagógicas específicas.

## Não entra no MVP

- Billing/pagamentos do piloto.
- IA/RAG em produção sem governança própria.
- Comunidade aberta/moderação avançada.
- Diploma, crédito acadêmico ou claims universitários.

## Backlog priorizado

1. **P0:** matriz/preset de permissões de professora e operador.
2. **P0:** política operacional de certificado de curso livre.
3. **P1:** configuração controlada Organization + UserGroup + Course + locks.
4. **P1:** validação de progress/enrollment e critérios de conclusão.
5. **P2:** analytics de turma e exportação segura.
6. **P3:** presença, portfólio e notificações.
