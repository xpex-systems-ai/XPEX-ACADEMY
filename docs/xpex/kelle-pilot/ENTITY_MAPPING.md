# Mapeamento de entidades do piloto

| Entidade de negócio | Implementação existente | Lacuna | Decisão sugerida |
|---|---|---|---|
| Kelle Digital Lab | `Organization` com `slug`, `org_uuid`, imagens, links e configuração; associação via `UserOrganization` | Definir configuração operacional sem dados reais | Representar como organização/tenant existente |
| Professora Kelle | Usuário associado à organização com `Role`; RBAC em `roles.py` e `security/rbac/*` | Papel exato depende de direitos mínimos e escopo por turma | Usar maintainer ou custom role restrita; evitar admin salvo operação |
| Aluno | `User`, `UserOrganization`, `UserGroupUser`, trail runs e submissions | Fluxo de convite/cadastro do piloto precisa desenho posterior | Aluno como membro da organização e da turma piloto |
| Turma piloto | `UserGroup`, `UserGroupUser`, `UserGroupResource` | Sem entidade de cohort com datas, presença e instrutor | Usar user group como turma MVP; documentar lacuna de cohort formal |
| Curso Informática Básica com IA | `Course` com `org_id`, `course_uuid`, `public`, `published`, `extra_metadata` | Conteúdo curricular ainda não existe | Criar curso em missão futura, sem seed de produção nesta missão |
| Módulos | `Chapter` com `course_id`, `org_id`, `lock_type`, `extra_metadata` | Método NAVE IA não é tipo nativo | Mapear módulos NAVE IA para chapters/metadados/documentação |
| Aulas | `Activity` com tipos vídeo, documento, dinâmico, assignment, custom e SCORM | Necessário desenho curricular | Usar activities por aula/material |
| Atividades práticas | `Assignment`, tasks/submissions nos serviços de assignments | Portfólio formal não existe | Usar assignment/submission como evidência inicial |
| Progresso | `TrailRun`, `TrailStep` e endpoints/serviços de trail | Pode não cobrir presença síncrona | Usar para avanço acadêmico; presença vira lacuna P1/P2 |
| Certificado de curso livre | `Certifications` e `CertificateUser` por curso | Wording e critérios precisam governança | Usar mecanismo existente com template explicitamente de curso livre |
| Presença | Não foi encontrada entidade nativa de attendance; há analytics e trail progress | Lacuna funcional | Não implementar no MVP técnico inicial; planejar módulo futuro se obrigatório |
| Portfólio do aluno | Assignments, submissions, boards/playgrounds e media podem registrar evidências | Não há página/entidade de portfólio consolidado | Começar com submissions e evidências anexas; portfólio formal em missão futura |
| Método NAVE IA | `Course.extra_metadata`, `Chapter.extra_metadata`, estrutura de chapters/activities e docs | Não há learning path/metodologia nativa específica | Tratar como estrutura curricular documentada e metadados, não nova tabela |
| Assistente de IA | RAG por curso, chat de atividade/editor, geração de assignment/quiz/imagem/áudio | Exige configuração de créditos, modelos e guardrails | Habilitar apenas em missão própria após política de segurança |
