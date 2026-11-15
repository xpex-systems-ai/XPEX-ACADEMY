# XPeX Academy — Gate E2E da primeira matrícula (Polo Kelle)

**Estado:** BLOQUEADO até backend FastAPI e migrações acadêmicas operacionais. Este documento não comprova matrícula concluída.

## Inventário verificado
- Vercel: preview de frontend implantado, mas o projeto auditado não tinha `NEXT_PUBLIC_LEARNHOUSE_BACKEND_URL` configurada.
- Supabase dedicado: `krvoedwbdnvoziiaavwp`; zero tabelas públicas e zero migrações registradas na última inspeção.
- Railway: dois projetos acessíveis, `compassionate-illumination` (serviço GXEON-AI) e `GXEON-AI` (serviço gxeon i.a). Nenhum serviço nomeado Academy encontrado. Isso não prova que não exista outro backend em outra conta.
- Firebase: integração prevista, configuração e telemetria de produção ainda não verificadas.

## Preparação obrigatória
1. Identificar hospedagem real do FastAPI; validar health, login e sessão no preview.
2. Revisar histórico de migrações Alembic, backup/restauração e compatibilidade com PostgreSQL 17; aplicar somente em staging dedicado após revisão.
3. Confirmar vínculo de identidade com Polo Kelle e autorização server-side por tenant e papel.
4. Criar curso de teste **não público**, aula curta e uma conta sintética de aluno; não utilizar dados pessoais de menores.
5. Não processar pagamentos reais no ensaio; usar ambiente sandbox do provedor autorizado.

## Cenários de aceitação (executar com evidências)
| ID | Cenário | Critério de aprovação | Evidência |
| --- | --- | --- | --- |
| E2E-01 | Login aluno sintético | Sessão válida e identidade correta | HTTP/trace redigido |
| E2E-02 | Acesso ao Polo Kelle | Tenant correto, sem acesso a outros Polos | Teste positivo + negativo |
| E2E-03 | Matrícula no curso teste | Uma matrícula persistida; retry idempotente | ID sintético e registro auditável |
| E2E-04 | Abrir aula | Conteúdo autorizado acessível, sem 403/500 | Captura sem PII e trace |
| E2E-05 | Salvar progresso | Progresso persiste após logout/login | Leitura pós-reautenticação |
| E2E-06 | Permissão cruzada | Outro aluno/tenant não acessa o progresso | 403/404 e logs redigidos |
| E2E-07 | Professor | Professor do Polo visualiza turma autorizada | Captura com dados sintéticos |
| E2E-08 | Pagamento sandbox | Checkout, webhook assinado, aceite e conciliação | Evento de teste e ledger de sandbox |
| E2E-09 | Certificado sintético | Após conclusão elegível, certificado único e verificável; aluno/tenant incorretos não podem acessar; regra de revogação verificada | ID sintético, verificação, teste negativo e logs redigidos |

## Go/no-go
- **GO para piloto fechado:** E2E-01 a E2E-07 e E2E-09 aprovados, migrações/backup comprovados, revisão humana concluída.
- **GO para matrícula paga:** piloto fechado aprovado + E2E-08 + políticas de privacidade, termos e suporte + aprovação humana.
- **NO-GO:** backend ausente, banco sem schema, isolamento de Polo não validado, autenticação simulada, checkout não reconciliado.

## Integrações posteriores
- Google/GitHub OAuth somente após backend e identidade canônica validados.
- ChatGPT via autorização OAuth de app/MCP; não presumir que sessão ChatGPT autentique na Academy.
- Firebase para telemetria com consentimento e sem dados sensíveis; Google AI Studio para produção assistida de materiais **após** fluxo acadêmico básico funcionar.

**Evidence First:** preencher resultados somente com execução real; não converter este checklist em alegação de testes aprovados.
