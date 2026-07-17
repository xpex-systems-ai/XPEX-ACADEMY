# Permissions Matrix — Learning Core

| Papel | Direitos mínimos | Limites | Riscos | Decisões pendentes |
|---|---|---|---|---|
| Aluno | Ler organização própria; ler curso liberado; ler atividades publicadas/restritas ao grupo; criar progresso próprio; enviar submissions próprias | Não editar curso, turma, papéis, certificado ou organização | Exposição cruzada se usergroup/org_id forem ignorados | Definir política de convite e matrícula |
| Professora | Ler/editar cursos atribuídos; ler progresso/submissions da turma; comentar/avaliar assignments se suportado; ler usergroups do escopo | Sem billing, domains, auth, roles globais, migrations, dados de outras turmas | Privilégio excessivo por role amplo | Criar preset de direitos com menor privilégio |
| Operador | Configurar organização, usergroup, vincular usuários/recursos, publicar curso conforme checklist | Sem alterar código, DB manual ou claims acadêmicos | Erro operacional pode liberar curso público indevidamente | Checklist de operação do piloto |
| Admin | Administrar organização e papéis, aprovar certificado e auditoria | Deve respeitar governança Trinity Flow e LGPD/secrets | Concentração de permissões | Política de aprovação humana |

## Observações

`Role.rights` contém buckets de permissões para recursos como courses, activities, certifications, usergroups e assignments. API tokens também validam permissões por bucket, mas não devem ser usados por aluno/professora no MVP.
