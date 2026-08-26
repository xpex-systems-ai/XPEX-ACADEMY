export type XpexModuleGuide = {
  module: number
  title: string
  objective: string
  explanation: string
  practice: string
}

const guides: XpexModuleGuide[] = [
  {
    module: 1,
    title: 'Fundamentos de Inteligência Artificial',
    objective: 'Entender o que é IA, onde ela funciona bem, onde falha e como estudar com responsabilidade.',
    explanation: 'Inteligência Artificial reúne técnicas capazes de executar tarefas de percepção, previsão, geração, classificação e decisão. Machine Learning aprende padrões a partir de dados; Deep Learning usa redes neurais profundas; IA generativa produz novos conteúdos a partir de padrões aprendidos. Modelos calculam respostas prováveis e podem errar com confiança, por isso decisões importantes precisam de revisão humana.',
    practice: 'Escolha três tarefas do seu dia e identifique entrada, resultado esperado, erro grave possível e necessidade de revisão humana.',
  },
  {
    module: 2,
    title: 'Como funcionam LLMs e IA generativa',
    objective: 'Compreender tokens, contexto, previsão de sequência e os limites práticos dos modelos de linguagem.',
    explanation: 'LLMs transformam texto em tokens, representam esses tokens matematicamente e estimam qual sequência é mais provável a partir do contexto disponível. A janela de contexto limita o que o modelo consegue considerar de uma vez, e uma resposta fluente não é garantia de verdade. O uso profissional exige contexto claro, fontes verificáveis e validação do resultado.',
    practice: 'Compare respostas para a mesma pergunta com pouco contexto e com contexto estruturado, observando precisão e consistência.',
  },
  {
    module: 3,
    title: 'Prompt Engineering',
    objective: 'Aprender a transformar intenção em instruções claras, verificáveis e reutilizáveis.',
    explanation: 'Um bom prompt define papel, objetivo, contexto, restrições, formato de saída e critérios de qualidade. Em vez de buscar uma frase mágica, o trabalho profissional é desenhar uma especificação que possa ser testada, revisada e melhorada. Exemplos, rubricas e etapas de verificação reduzem ambiguidades.',
    practice: 'Reescreva um pedido genérico usando objetivo, contexto, restrições, formato e critérios de aceite.',
  },
  {
    module: 4,
    title: 'Ferramentas de IA para produtividade',
    objective: 'Usar IA para acelerar pesquisa, escrita, análise e organização sem perder controle sobre a qualidade.',
    explanation: 'Ferramentas de IA podem resumir, estruturar, comparar, rascunhar e transformar informação. O ganho real aparece quando cada ferramenta é ligada a um fluxo de trabalho com entrada confiável, revisão humana e destino definido. Automação sem processo apenas acelera confusão.',
    practice: 'Escolha um fluxo repetitivo e desenhe onde a IA entra, o que precisa ser revisado e qual resultado deve ser salvo.',
  },
  {
    module: 5,
    title: 'Automação com IA',
    objective: 'Projetar automações que combinem gatilhos, regras, modelos e ações com segurança.',
    explanation: 'Uma automação de IA recebe um evento, reúne contexto, toma uma decisão limitada por regras e executa uma ação observável. Fluxos confiáveis precisam de idempotência, tratamento de erros, limites, logs e pontos de aprovação para ações sensíveis. A IA deve operar dentro de uma política explícita.',
    practice: 'Modele uma automação com gatilho, dados de entrada, decisão, ação, fallback e evidência de execução.',
  },
  {
    module: 6,
    title: 'APIs e integrações',
    objective: 'Entender como sistemas trocam dados e como conectar IA a aplicações reais.',
    explanation: 'APIs expõem contratos para leitura e escrita de dados. Integrações profissionais exigem autenticação, validação de payload, tratamento de status HTTP, limites de taxa, retries e proteção de segredos. Uma integração só está pronta quando falhas são previsíveis e observáveis.',
    practice: 'Desenhe uma chamada de API com método, endpoint, autenticação, payload, resposta esperada e estratégia de erro.',
  },
  {
    module: 7,
    title: 'RAG e conhecimento privado',
    objective: 'Aprender como combinar modelos com fontes privadas e recuperáveis sem confundir memória com verdade.',
    explanation: 'RAG recupera trechos relevantes de uma base de conhecimento e os entrega ao modelo como contexto para responder. A qualidade depende de ingestão, segmentação, indexação, recuperação, autorização e citação. O modelo não deve receber conteúdo que o usuário não tem permissão para acessar.',
    practice: 'Defina uma pequena base documental e descreva ingestão, busca, filtros de acesso e evidência usada na resposta.',
  },
  {
    module: 8,
    title: 'Agentes de IA',
    objective: 'Entender agentes como sistemas que planejam e usam ferramentas sob regras, estado e observabilidade.',
    explanation: 'Um agente combina modelo, instruções, ferramentas, memória ou estado e uma política de execução. O valor não está em autonomia ilimitada, mas em delegar tarefas bem delimitadas com permissões mínimas, verificações, orçamento e trilha de auditoria. Quanto maior o impacto da ação, maior deve ser o controle.',
    practice: 'Projete um agente com missão, ferramentas permitidas, dados disponíveis, limites, condição de parada e evidências.',
  },
  {
    module: 9,
    title: 'Construção de projetos reais',
    objective: 'Transformar conceitos em um produto verificável, com requisitos, implementação e evidências.',
    explanation: 'Projetos reais começam pelo problema e pelos critérios de sucesso. Depois vêm arquitetura, dados, experiência, testes, segurança, deploy e observabilidade. A demonstração final precisa provar o caminho crítico funcionando, não apenas mostrar telas ou código isolado.',
    practice: 'Escolha um problema, escreva três critérios de aceite e defina a menor versão que consegue provar valor de ponta a ponta.',
  },
  {
    module: 10,
    title: 'IA aplicada a negócios e carreira',
    objective: 'Conectar capacidade técnica a impacto mensurável, responsabilidade e posicionamento profissional.',
    explanation: 'Aplicar IA a negócios exige medir tempo, qualidade, custo, risco e resultado, evitando métricas de vaidade. Na carreira, portfólio com problema, decisão, implementação e evidência vale mais do que listas de ferramentas. Governança e ética fazem parte da competência profissional.',
    practice: 'Escolha um caso de uso e defina benefício esperado, custo, risco, responsável e métrica de sucesso.',
  },
  {
    module: 11,
    title: 'Projeto final',
    objective: 'Integrar o aprendizado em uma solução completa, demonstrável e auditável.',
    explanation: 'O projeto final reúne contexto, IA, integração, segurança, experiência e evidência. A entrega deve explicar o problema, a arquitetura, as escolhas, os limites, os testes e o resultado obtido. O objetivo é provar domínio do processo inteiro, incluindo o que a solução ainda não faz.',
    practice: 'Construa a entrega final com problema, arquitetura, execução, testes, evidências, riscos e próximos passos.',
  },
]

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()

export function getXpexModuleGuide(chapterName?: string | null, activityName?: string | null): XpexModuleGuide | null {
  const haystack = normalize(`${chapterName ?? ''} ${activityName ?? ''}`)
  if (!haystack) return null
  return guides.find(guide => haystack.includes(normalize(guide.title))) ?? null
}
