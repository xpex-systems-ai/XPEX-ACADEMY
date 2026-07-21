# Checklist GO/NO-GO — primeiro deploy real de staging

Classifique cada item como `GO`, `PENDÊNCIA EXTERNA` ou `NO-GO`. Não prossiga para deploy real com qualquer `NO-GO`.

| Item | Classificação | Evidência |
|---|---|---|
| Branch e commit aprovados | PENDÊNCIA EXTERNA | PR revisado contra `dev` |
| CI verde | PENDÊNCIA EXTERNA | Link do workflow |
| Projeto correto | PENDÊNCIA EXTERNA | `gcloud projects describe` |
| Conta correta | PENDÊNCIA EXTERNA | `gcloud auth list --filter=status:ACTIVE` |
| Billing ativo | PENDÊNCIA EXTERNA | Billing `true` |
| APIs ativas | PENDÊNCIA EXTERNA | Lista de APIs obrigatórias |
| Recursos confirmados | PENDÊNCIA EXTERNA | Inventário preenchido |
| IAM confirmado | PENDÊNCIA EXTERNA | Policy revisada |
| Secrets existentes | PENDÊNCIA EXTERNA | Nomes/versionamento, sem valores |
| `.env.staging` não rastreado | PENDÊNCIA EXTERNA | `git check-ignore .env.staging` |
| Preflight GO | PENDÊNCIA EXTERNA | Saída salva |
| Dry-run revisado | PENDÊNCIA EXTERNA | Plano salvo |
| Imagem definida | PENDÊNCIA EXTERNA | Tag imutável |
| Banco acessível | PENDÊNCIA EXTERNA | Consulta/migração aprovada |
| Redis acessível | PENDÊNCIA EXTERNA | Conectividade aprovada |
| Bucket acessível | PENDÊNCIA EXTERNA | Bucket descrito |
| Domínio definido | PENDÊNCIA EXTERNA | DNS/URL Cloud Run |
| CORS definido | PENDÊNCIA EXTERNA | Origem permitida e não permitida |
| Rollback preparado | PENDÊNCIA EXTERNA | Revisão concreta registrada |
| Responsável pelo deploy identificado | PENDÊNCIA EXTERNA | Nome/contato |
| Janela de execução definida | PENDÊNCIA EXTERNA | Data/hora |
| Plano de observação pós-deploy | PENDÊNCIA EXTERNA | Logs/métricas responsáveis |
