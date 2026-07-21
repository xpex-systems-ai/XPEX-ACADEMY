# Guardrails de custo para staging

Não há preços exatos neste documento: valores dependem de região, configuração, cotas, uso, retenção e políticas comerciais vigentes. Antes do deploy real, o operador deve validar estimativas no console/calculadora oficial.

## Fontes de custo
- **Cloud Run:** requisições, CPU, memória, instâncias mínimas e tráfego de saída. Guardrail: `min-instances=0`, `MAX_INSTANCES` conservador, CPU/memória justificadas.
- **Cloud Build:** minutos de build e máquinas. Guardrail: builds manuais, tags explícitas e limpeza de imagens antigas.
- **Artifact Registry:** armazenamento de imagens e tráfego. Guardrail: retenção de tags e remoção planejada.
- **Cloud SQL:** custo contínuo de instância, storage, backups e rede. Guardrail: menor tier compatível, janelas de manutenção e desligamento quando permitido.
- **Redis/Memorystore:** custo contínuo enquanto provisionado. Guardrail: tamanho mínimo e desligamento se não usado.
- **VPC Connector:** pode gerar custo contínuo e de throughput. Guardrail: usar apenas para tráfego privado necessário.
- **Storage/bucket:** armazenamento, operações e egress. Guardrail: lifecycle/retention e objetos de teste mínimos.
- **Logs/Monitoring:** ingestão e retenção. Guardrail: nível de log apropriado, retenção curta para staging e alerta de volume.
- **Tráfego de saída:** chamadas públicas, downloads e integrações externas. Guardrail: smoke tests mínimos e bloqueio de cargas.

## Zero, baixo custo e custo contínuo
- **Custo zero potencial:** scripts locais, dry-run, consultas somente leitura dentro de limites gratuitos.
- **Baixo custo variável:** Cloud Run sem instâncias mínimas, Artifact Registry com poucas imagens, logs reduzidos.
- **Custo contínuo:** Cloud SQL, Redis, VPC Connector, retenção alta de logs/backups e recursos com capacidade reservada.

## Alertas e desligamento
Configure budget alert antes de comandos mutáveis. Critérios de desligamento: fim da janela de validação, erro de deploy sem rollback possível, custo acima do orçamento, vazamento de segredo, tráfego inesperado ou falha de health/CORS.
