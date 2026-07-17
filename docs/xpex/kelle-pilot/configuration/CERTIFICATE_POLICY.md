# Certificate Policy — Curso livre

## Decisão documental

Usar `Certifications` e `CertificateUser` existentes somente com texto explícito de **curso livre** e **projeto educacional independente**. Esta missão não cria certificado real.

## Campos e comportamento atual

- `Certifications.course_id` vincula a certificação ao curso.
- `Certifications.config` é JSON livre; o wording deve ser governado documentalmente.
- `CertificateUser` vincula usuário e certificação emitida.
- O serviço cria certificado quando todas as atividades do curso têm `TrailStep.complete=True` para o usuário e há certificação configurada.

## Wording obrigatório

O certificado deve declarar:

- `Curso livre`.
- `Projeto educacional independente.`
- Nome do curso: `Informática Básica com Inteligência Artificial`.
- Ausência de promessa de diploma, vínculo universitário, reconhecimento acadêmico externo, emprego ou renda.

## Bloqueios antes de produção

- [ ] Wording aprovado pelo Architect/Operador.
- [ ] Critério de conclusão testado em ambiente controlado.
- [ ] Todas as activities reais revisadas para evitar emissão prematura.
- [ ] Sem logotipo ou nome de faculdade.
- [ ] Sem carga horária, preço ou validade não aprovados.

## Exemplo documental de config

```json
{
  "notice": "EXEMPLO DOCUMENTAL — NÃO EXECUTAR EM PRODUÇÃO.",
  "type": "curso_livre",
  "project_disclaimer": "Projeto educacional independente.",
  "forbidden_claims": ["diploma", "vinculo_universitario", "promessa_emprego", "promessa_renda"],
  "wording_status": "pending_human_approval"
}
```
