export type PageTutorialId =
  | "dashboard"
  | "disciplinas"
  | "disciplina-detail"
  | "calendario"
  | "mapa"
  | "integralizacao"
  | "simulador"
  | "planos";

export interface PageTutorialStep {
  id: string;
  targetId: string | null;
  title: string;
  body: string;
}

export const PAGE_TUTORIALS: Record<PageTutorialId, PageTutorialStep[]> = {
  dashboard: [
    {
      id: "overview",
      targetId: null,
      title: "Dashboard",
      body: "Sua página inicial: indicadores do semestre, entregas próximas, grade resumida e cards de cada disciplina matriculada.",
    },
    {
      id: "subjects",
      targetId: "tutorial-subjects-section",
      title: "Cards das disciplinas",
      body: "Cada card resume nota, faltas, barras de risco, sala e tarefas. Clique no nome para abrir a disciplina completa.",
    },
    {
      id: "priority",
      targetId: "tutorial-subject-priority",
      title: "Prioridade",
      body: "O seletor no canto do card define prioridade (muito alta a muito baixa). Isso ordena os cards e fica salvo no navegador.",
    },
    {
      id: "grade",
      targetId: "tutorial-subject-grade",
      title: "Nota e situação",
      body: "NOTA mostra pontos sobre 100. O selo indica Seguro, Atenção, Crítico, Recuperação ou Reprovado com base na média de 60 pts.",
    },
    {
      id: "bars",
      targetId: "tutorial-subject-bars",
      title: "Barras de risco",
      body: "Barra de cima: nota acumulada vs linha de aprovação. Barra de baixo: faltas vs limite do SIGAA — cores seguem o risco.",
    },
    {
      id: "notifications",
      targetId: "notifications-bell",
      title: "Notificações",
      body: "O sino avisa tarefas e notas novas após cada sync, com lembretes 24h e 1h antes do prazo.",
    },
    {
      id: "profile",
      targetId: "profile-avatar",
      title: "Seu perfil",
      body: "Matrícula, contato, curso, último sync e plano. Abra pelo avatar no canto superior.",
    },
  ],
  disciplinas: [
    {
      id: "overview",
      targetId: null,
      title: "Lista de disciplinas",
      body: "Todas as matérias do semestre em tabela: prioridade, professor, horário, sala, nota e faltas.",
    },
    {
      id: "filters",
      targetId: "tutorial-discipline-list",
      title: "Busca e filtros",
      body: "Use a busca e os filtros (Todas, Risco, Crítico…) para achar matérias específicas rapidamente.",
    },
    {
      id: "open",
      targetId: "tutorial-discipline-row",
      title: "Abrir disciplina",
      body: "Clique em qualquer linha para ver notas, frequência, tarefas, ementa e grupo da turma.",
    },
  ],
  "disciplina-detail": [
    {
      id: "overview",
      targetId: null,
      title: "Página da disciplina",
      body: "Aqui você acompanha notas, faltas, tarefas e informações da turma sincronizadas com o SIGAA.",
    },
    {
      id: "properties",
      targetId: "tutorial-discipline-properties",
      title: "Personalizar",
      body: "Lápis para apelido, horário e professor exibidos; cor para destacar no mapa e nos cards; prioridade igual à do dashboard. Não altera o SIGAA.",
    },
    {
      id: "simulate",
      targetId: "tutorial-simulate-btn",
      title: "Simular notas",
      body: "Na aba Notas, use Simular para testar cenários sem mudar suas notas reais. Digite valores hipotéticos nas avaliações pendentes.",
    },
    {
      id: "simulate-how",
      targetId: null,
      title: "Como funciona a simulação",
      body: "A coluna Necessário mostra o mínimo em cada prova para fechar 60 pts. Use Limpar simulação para zerar e Notas reais para voltar ao sync.",
    },
  ],
  calendario: [
    {
      id: "overview",
      targetId: null,
      title: "Calendário",
      body: "Visualize tarefas, provas e eventos acadêmicos do semestre. Clique em um dia ou evento para ver detalhes.",
    },
    {
      id: "month",
      targetId: "tutorial-calendar-month",
      title: "Grade mensal",
      body: "Cada ponto colorido é um evento. Dias com entregas ficam destacados — clique para listar o que vence naquele dia.",
    },
    {
      id: "filters",
      targetId: "tutorial-calendar-filters",
      title: "Filtros",
      body: "Filtre por tipo: tarefas individuais, em grupo, provas ou eventos institucionais.",
    },
  ],
  mapa: [
    {
      id: "overview",
      targetId: null,
      title: "Mapa do curso",
      body: "Grade curricular do PPC com status de cada disciplina: concluída, cursando, liberada ou bloqueada por pré-requisito.",
    },
    {
      id: "stats",
      targetId: "tutorial-mapa-stats",
      title: "Resumo",
      body: "Contadores no topo mostram progresso geral — quantas disciplinas você já concluiu e quantas faltam.",
    },
    {
      id: "grid",
      targetId: "tutorial-mapa-grid",
      title: "Períodos e disciplinas",
      body: "Cada coluna é um período. Clique em uma disciplina para ver detalhes e pré-requisitos. Cores seguem o status acadêmico.",
    },
  ],
  integralizacao: [
    {
      id: "overview",
      targetId: null,
      title: "Integralização",
      body: "Acompanhe horas obrigatórias e complementares do PPC e registre atividades validadas.",
    },
    {
      id: "summary",
      targetId: "tutorial-integralizacao-summary",
      title: "Progresso total",
      body: "O card lateral resume quantas horas você já cumpriu versus o total exigido pelo curso.",
    },
    {
      id: "table",
      targetId: "tutorial-integralizacao-table",
      title: "Detalhe por categoria",
      body: "A tabela lista cada tipo de carga horária. Use o botão ? ao lado do título da tabela para o glossário de siglas CH.",
    },
  ],
  simulador: [
    {
      id: "overview",
      targetId: null,
      title: "Montar grade",
      body: "Simule sua matrícula do próximo semestre com turmas reais do SIGAA — conflitos de horário e corequisitos são validados aqui.",
    },
    {
      id: "sync",
      targetId: "tutorial-enrollment-sync",
      title: "Turmas ofertadas",
      body: "Sincronize para buscar turmas disponíveis. Só aparecem disciplinas que você ainda pode cursar neste semestre.",
    },
    {
      id: "sidebar",
      targetId: "tutorial-enrollment-sidebar",
      title: "Escolher turma",
      body: "Busque pelo apelido ou nome. Clique em uma turma para selecioná-la — variantes de horário expandem dentro do mesmo card.",
    },
    {
      id: "schedule",
      targetId: "tutorial-enrollment-schedule",
      title: "Alocar na grade",
      body: "Com uma turma selecionada, clique nas células destacadas. Para remover, clique na célula ocupada ou use Limpar.",
    },
    {
      id: "coreq",
      targetId: null,
      title: "Corequisitos",
      body: "Teoria e laboratório do mesmo par devem ir juntos na grade. Após alocar uma, o sistema pede a outra antes de continuar.",
    },
  ],
  planos: [
    {
      id: "overview",
      targetId: null,
      title: "Planos de assinatura",
      body: "Escolha trial, semestre ou anual. O pagamento via PIX será habilitado em breve — por enquanto os botões estão desativados.",
    },
  ],
};

export function getPageTutorialSteps(id: PageTutorialId): PageTutorialStep[] {
  return PAGE_TUTORIALS[id];
}
