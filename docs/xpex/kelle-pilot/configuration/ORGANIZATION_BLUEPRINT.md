# Organization Blueprint — Kelle Digital Lab

## Decisão documental

Representar **Kelle Digital Lab** como `Organization` existente, sem criar organização real nesta missão.

## Convenções

| Item | Valor documental | Motivo |
|---|---|---|
| Nome | `Kelle Digital Lab` | Nome oficial aprovado para o piloto |
| Slug reservado | `kelle-digital-lab` | Legível, estável e compatível com campo `slug` único |
| Classificação pública | `Curso livre` | Evita alegação acadêmica indevida |
| Disclaimer | `Projeto educacional independente.` | Obrigatório para compliance |
| `explore` | `false` inicialmente | Evita descoberta pública antes de revisão |
| `scripts` | `{}` | Evita terceiros, pixels e risco de secret |
| `links`/`socials` | placeholders documentais | Sem URLs privadas ou pessoais |
| Imagens | placeholders aprováveis | Sem logotipo de faculdade |

## Exemplo documental não executável

```json
{
  "notice": "EXEMPLO DOCUMENTAL — NÃO EXECUTAR EM PRODUÇÃO.",
  "name": "Kelle Digital Lab",
  "slug": "kelle-digital-lab",
  "email": "<contato-operacional-aprovado@example.invalid>",
  "description": "Curso livre de informática básica com inteligência artificial.",
  "about": "Projeto educacional independente.",
  "socials": {},
  "links": {},
  "scripts": {},
  "explore": false,
  "label": "Curso livre",
  "logo_image": "<asset-aprovado-ou-vazio>",
  "thumbnail_image": "<asset-aprovado-ou-vazio>"
}
```

## Isolamento por `org_id`

- Toda associação de usuário, turma, curso, capítulo, atividade, assignment, progresso e certificado deve permanecer dentro do `org_id` da organização.
- Não misturar membros de outras organizações em `UserGroupUser`.
- Não vincular `UserGroupResource.resource_uuid` de outra organização.

## Checklist futuro

- [ ] Confirmar que não existe organização com slug `kelle-digital-lab`.
- [ ] Aprovar e-mail operacional não pessoal.
- [ ] Aprovar texto de descrição e about sem promessa de emprego, renda, diploma ou vínculo universitário.
- [ ] Manter `explore=false` até validação de publicação.
- [ ] Manter `scripts={}` até missão específica de analytics/marketing.
