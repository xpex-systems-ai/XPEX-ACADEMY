# Jornadas do piloto

## Pré-condições

- Organização Kelle Digital Lab existe como tenant/organização.
- Professora e alunos pertencem à organização correta.
- Turma piloto existe como user group.
- Curso livre foi criado e vinculado à organização.
- Certificado usa texto de curso livre e projeto educacional independente.

## Aluno

```mermaid
flowchart TD
  A[Conhece o projeto] --> B[Cria ou recebe acesso]
  B --> C[Entra na organização]
  C --> D[É associado à turma piloto]
  D --> E[Acessa curso livre]
  E --> F[Estuda capítulos e atividades]
  F --> G[Envia assignments/evidências]
  G --> H[Acompanha progresso]
  H --> I{Elegível?}
  I -- Sim --> J[Recebe certificado de curso livre]
  I -- Não --> F
```

## Professora Kelle

```mermaid
flowchart TD
  A[Acessa área autorizada] --> B[Seleciona organização Kelle Digital Lab]
  B --> C[Consulta turma piloto]
  C --> D[Visualiza alunos e progresso]
  D --> E[Organiza/libera conteúdo permitido]
  E --> F[Consulta atividades e submissions]
  F --> G[Apoia critérios de certificado]
```

## Operador XpeX

```mermaid
flowchart TD
  A[Configura organização] --> B[Configura responsável]
  B --> C[Cria turma como user group]
  C --> D[Cria/vincula curso livre]
  D --> E[Vincula alunos]
  E --> F[Audita permissões]
  F --> G[Acompanha operação]
```

## Estados principais

| Objeto | Estados atuais/reutilizáveis | Observação |
|---|---|---|
| Curso | `public`, `published` | Controla exposição e publicação |
| Capítulo | `lock_type` | Controla bloqueio e acesso do capítulo |
| Atividade | `lock_type`, `published` | Controla bloqueio e publicação da atividade |
| Trail run | `STATUS_IN_PROGRESS`, `STATUS_COMPLETED`, `STATUS_PAUSED`, `STATUS_CANCELLED` | Base para progresso |
| Assignment | `published`, grading type, submission state nos serviços | Base para evidências práticas |
| Certificado | Configuração por curso e emissão por usuário | Exige texto de curso livre |

## Exceções e lacunas

- Aluno sem organização não deve acessar conteúdo restrito.
- Aluno fora da turma não deve acessar recursos de turma se lock/user group for usado.
- Professora com papel amplo pode visualizar mais que a turma; isso deve ser mitigado por custom role ou escopo operacional.
- Presença síncrona e portfólio consolidado não têm entidade dedicada encontrada.
