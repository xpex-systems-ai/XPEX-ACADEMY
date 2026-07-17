# Course Blueprint — Informática Básica com Inteligência Artificial

## Decisão documental

Criar futuramente um `Course` privado/restrito, estruturado por `Chapter` para representar o Método NAVE IA e `Activity`/`Assignment` para aulas e práticas. Esta missão não cria curso real.

## Configuração candidata do Course

| Campo | Valor documental inicial |
|---|---|
| `name` | `Informática Básica com Inteligência Artificial` |
| `description` | `Curso livre introdutório de informática básica com apoio de inteligência artificial.` |
| `about` | `Projeto educacional independente.` |
| `learnings` | Objetivos curriculares aprovados em missão futura |
| `tags` | `curso-livre, informatica-basica, inteligencia-artificial` |
| `thumbnail_type` | `image` |
| `public` | `false` |
| `published` | `false` até checklist final |
| `open_to_contributors` | `false` |
| `seo` | `robots_noindex=true` se usado antes de publicação pública |
| `extra_metadata` | Metodologia, compliance e status documental |

## Método NAVE IA sem novo banco

| Letra | Chapter documental | Metadata sugerida | Objetivo |
|---|---|---|---|
| N | `N — Navegador` | `{"nave_step":"N","nave_label":"Navegador"}` | Orientação inicial, navegação segura no ambiente digital e reconhecimento dos recursos do curso |
| A | `A — Aprendizagem` | `{"nave_step":"A","nave_label":"Aprendizagem"}` | Construção guiada de fundamentos de informática básica e inteligência artificial |
| V | `V — Vivência` | `{"nave_step":"V","nave_label":"Vivência"}` | Experiências práticas, exercícios contextualizados e aplicação acompanhada |
| E | `E — Evolução` | `{"nave_step":"E","nave_label":"Evolução"}` | Consolidação, melhoria contínua, autonomia e próximos passos |

## Activities e Assignments

- Aulas expositivas podem usar `TYPE_DOCUMENT`, `TYPE_VIDEO`, `TYPE_DYNAMIC` ou `TYPE_CUSTOM` conforme conteúdo real.
- Práticas avaliáveis devem usar `TYPE_ASSIGNMENT` e registro em `Assignment`.
- Assignments devem iniciar `published=false` e só abrir após revisão de tarefas, critérios e dados solicitados.
- Evitar upload de documentos pessoais no MVP.

## Mermaid

```mermaid
flowchart LR
  C[Course privado] --> N[Chapter N]
  C --> A[Chapter A]
  C --> V[Chapter V]
  C --> E[Chapter E]
  N --> N1[Activities]
  A --> A1[Assignments]
  V --> V1[Vivência prática]
  E --> E1[Evolução e projeto final]
```
