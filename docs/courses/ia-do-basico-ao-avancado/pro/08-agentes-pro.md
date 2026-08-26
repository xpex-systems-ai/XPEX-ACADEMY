# Módulo 8 — Agentes de IA

## Resultado esperado
O aluno entende um agente como sistema com missão, modelo, ferramentas, estado, regras, condição de parada e evidência; evita autonomia ilimitada.

## Roteiro de vídeo — 12 a 15 min
1. Diferença entre chat, automação e agente.
2. Componentes: objetivo, instruções, ferramentas, memória/estado, política e observabilidade.
3. Planejar não significa ter permissão para executar.
4. Princípio do menor privilégio.
5. Limites de custo, tempo, tentativas e escopo.
6. Aprovação humana para ações externas ou irreversíveis.

## Laboratório GX
Projete um agente de estudo ou organização. Dê a ele apenas ferramentas necessárias. Defina o que ele pode ler, o que pode sugerir e o que nunca pode executar sozinho.

## Desafio aplicado
Criar o “Contrato do Agente”: missão, entradas, ferramentas, permissões, limites, condição de parada, fallback e log mínimo.

## Critérios de domínio
- separa planejamento de ação;
- usa permissões mínimas;
- define parada e fallback;
- registra evidência suficiente para auditoria.

## Evidência
Contrato do agente + dois cenários de teste, sendo um cenário normal e um em que o agente deve recusar ou pedir aprovação.
