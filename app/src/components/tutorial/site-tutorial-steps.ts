export type SiteTutorialRoute =
  | string
  | { type: "first-discipline" };

export interface SiteTutorialStep {
  id: string;
  targetId: string | null;
  title: string;
  body: string;
  route?: SiteTutorialRoute;
}

export const SITE_TUTORIAL_STEPS: SiteTutorialStep[] = [
  {
    id: "welcome",
    targetId: null,
    title: "Bem-vindo ao Academic Planner",
    body: "Este tutorial explica como ler os cards do dashboard, definir prioridades, entender as barras de nota e falta, e simular cenários nas disciplinas. Avance com Próximo ou feche com Pular.",
  },
  {
    id: "dashboard",
    targetId: "nav-dashboard",
    route: "/",
    title: "Dashboard",
    body: "Sua página inicial: indicadores do semestre, tarefas próximas, horário semanal e um resumo de cada disciplina. Role até a seção Disciplinas do Semestre para ver os cards.",
  },
  {
    id: "subject-cards",
    targetId: "tutorial-subjects-section",
    route: "/",
    title: "Cards das disciplinas",
    body: "Cada card resume uma matrícula: nota parcial, faltas, barras de risco, sala e tarefas pendentes. Clique no card para abrir a disciplina completa.",
  },
  {
    id: "priority",
    targetId: "tutorial-subject-priority",
    route: "/",
    title: "Prioridade da disciplina",
    body: "O ícone no canto superior direito define a prioridade (de muito alta a muito baixa). Isso ordena os cards e ajuda você a focar no que importa. A escolha fica salva no seu navegador.",
  },
  {
    id: "grade-score",
    targetId: "tutorial-subject-grade",
    route: "/",
    title: "Nota e situação",
    body: "NOTA mostra seus pontos sobre 100 (soma das avaliações). O selo ao lado indica a situação: Seguro, Atenção, Crítico, Recuperação ou Reprovado — com base na média mínima de 60 pts e na distribuição das provas.",
  },
  {
    id: "bars",
    targetId: "tutorial-subject-bars",
    route: "/",
    title: "As duas barras",
    body: "Barra de cima (nota): preenchimento = pontos que você já tem; traço vertical branco = linha de aprovação (60 pts). Cor verde/amarela/vermelha segue o risco. Barra de baixo (faltas): quanto mais cheia, mais perto do limite de faltas do SIGAA — também com cores de risco.",
  },
  {
    id: "disciplinas-nav",
    targetId: "nav-disciplinas",
    route: "/disciplinas",
    title: "Lista de disciplinas",
    body: "Aqui você vê todas as matérias em tabela: prioridade, professor, horário, sala, nota e faltas. Use busca e filtros (Todas, Risco, Crítico…) para achar matérias específicas.",
  },
  {
    id: "open-discipline",
    targetId: "tutorial-discipline-row",
    route: "/disciplinas",
    title: "Abrir uma disciplina",
    body: "Clique em qualquer linha para ver notas detalhadas, frequência, tarefas, ementa e grupo. No próximo passo abriremos a primeira disciplina da lista automaticamente.",
  },
  {
    id: "simulate-btn",
    targetId: "tutorial-simulate-btn",
    route: { type: "first-discipline" },
    title: "Botão Simular",
    body: "Na aba Notas, use Simular para testar cenários sem alterar suas notas reais do SIGAA. O modo simulação liga campos editáveis em cada avaliação pendente.",
  },
  {
    id: "simulate-how",
    targetId: null,
    route: { type: "first-discipline" },
    title: "Como usar a simulação",
    body: "Digite notas hipotéticas nas avaliações vazias. A coluna Necessário mostra o mínimo em cada prova para fechar 60 pts. O selo Aprovado/Reprovado atualiza na hora. Use Limpar simulação para zerar os valores testados e Notas reais para voltar ao sync.",
  },
  {
    id: "discipline-properties",
    targetId: "tutorial-discipline-properties",
    route: { type: "first-discipline" },
    title: "Personalizar a disciplina",
    body: "No topo da disciplina: lápis para apelido, horário e professor exibidos; bolinha de cor para destacar no mapa e nos cards; prioridade igual à do dashboard. Alterações locais não vão para o SIGAA.",
  },
  {
    id: "notifications",
    targetId: "notifications-bell",
    title: "Notificações",
    body: "O sino avisa tarefas e notas novas após cada sync, com lembretes 24h e 1h antes do prazo. Itens lidos continuam visíveis por 24 horas.",
  },
  {
    id: "profile",
    targetId: "profile-avatar",
    title: "Seu perfil",
    body: "Matrícula, CPF, contato, curso, último sync, plano assinado e renovação. Você pode reabrir este tutorial quando quiser.",
  },
  {
    id: "done",
    targetId: null,
    title: "Pronto!",
    body: "Explore o calendário, mapa do curso e integralização no menu. Em breve adicionamos mais dicas sobre o Sync SIGAA neste tutorial.",
  },
];

export function resolveTutorialRoute(
  route: SiteTutorialRoute | undefined,
  cachedDisciplineCode?: string | null
): string | null {
  if (!route) return null;
  if (typeof route === "string") return route;

  if (route.type === "first-discipline") {
    const row = document.querySelector<HTMLElement>(
      '[data-tutorial-id="tutorial-discipline-row"]'
    );
    const code =
      cachedDisciplineCode?.trim() ||
      row?.dataset.disciplineCode?.trim() ||
      null;
    return code ? `/disciplinas/${encodeURIComponent(code)}` : "/disciplinas";
  }

  return null;
}
