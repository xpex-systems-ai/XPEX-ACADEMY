# Análise de lacunas

## Já existe

- Organização/tenant, usuários, associação usuário-organização e papéis.
- User groups e recursos associados.
- Cursos, capítulos, atividades, assignments e certificados.
- Progresso por trails/runs/steps.
- Comunidades, analytics, RAG e recursos de IA configuráveis.

## Precisa adaptar/configurar

| Prioridade | Item | Motivo |
|---|---|---|
| P0 | Definir Kelle Digital Lab como organização isolada | Base multi-tenant do piloto |
| P0 | Definir papel mínimo da professora | Evita ampliação indevida de permissões |
| P0 | Criar turma piloto como user group | Representa cohort sem nova tabela |
| P0 | Política de certificado de curso livre | Evita alegação acadêmica |
| P1 | Estrutura curricular do Método NAVE IA | Precisa virar chapters/activities/metadados |
| P1 | Critérios de elegibilidade de certificado | Necessário antes de emissão real |
| P1 | Configuração de IA/RAG e créditos | Segurança, custos e governança |

## Precisa construir futuramente

| Prioridade | Lacuna | Justificativa |
|---|---|---|
| P1 | Visão por turma/cohort se dashboards atuais forem amplos | Menor privilégio e operação pedagógica |
| P2 | Presença/aula síncrona | Não há entidade attendance nativa encontrada |
| P2 | Portfólio consolidado do aluno | Submissions existem, mas não portfólio formal |
| P2 | Relatórios específicos do piloto | Analytics gerais podem não atender operação local |
| P3 | Templates NAVE IA reutilizáveis | Acelera criação de novas turmas após piloto |

## Não entra no MVP

- Nova identidade visual institucional externa.
- Certificação universitária ou alegação de reconhecimento acadêmico.
- Billing/preços/comercial.
- Alteração de proxy, autenticação, RBAC core, modelos ou migrations.
- Seeds de produção com pessoas reais.

## Riscos

- Papel maintainer ser amplo demais para a professora.
- Conteúdo restrito configurado como público por erro operacional.
- Certificado com texto ambíguo sugerindo vínculo acadêmico.
- IA habilitada sem política de créditos, privacidade e fontes.
