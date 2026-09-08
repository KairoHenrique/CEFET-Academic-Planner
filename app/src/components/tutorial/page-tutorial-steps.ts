export type PageTutorialId =
  | "dashboard"
  | "disciplinas"
  | "disciplina-detail"
  | "calendario"
  | "mapa"
  | "integralizacao"
  | "simulador"
  | "planos";

export type PageTutorialVariant = "desktop" | "mobile";

export interface PageTutorialStep {
  id: string;
  targetId: string | null;
  title: string;
  body: string;
}

/** Desktop — layout completo do site v1.0. */
export const PAGE_TUTORIALS_DESKTOP: Record<PageTutorialId, PageTutorialStep[]> = {
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
      body: "O sino avisa tarefas e notas novas após o sync. Eventos e datas acadêmicas: ao cadastrar/aparecer, 1 dia antes e no dia. O painel some 24h depois de visto.",
    },
    {
      id: "sync",
      targetId: "sync-sigaa",
      title: "Sincronizar",
      body: "O botão Sync atualiza dados do SIGAA (notas, faltas, tarefas, calendário). Use quando quiser forçar uma atualização.",
    },
    {
      id: "profile",
      targetId: "profile-avatar",
      title: "Seu perfil",
      body: "Matrícula, contato, curso, último sync, preferências de notificação e plano. Abra pelo avatar no canto superior.",
    },
  ],
  disciplinas: [
    {
      id: "overview",
      targetId: null,
      title: "Lista de disciplinas",
      body: "Todas as matérias do semestre: prioridade, professor, horário, sala, nota e faltas.",
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
      body: "Agenda do semestre: tarefas, provas, eventos manuais e datas acadêmicas oficiais do CEFET.",
    },
    {
      id: "filters",
      targetId: "tutorial-calendar-filters",
      title: "Filtros",
      body: "Filtre por tipo (tarefas, provas, eventos…). No mobile, a barra de filtros rola na horizontal se precisar.",
    },
    {
      id: "month",
      targetId: "tutorial-calendar-month",
      title: "Grade mensal",
      body: "Cada marcador colorido é um evento. Clique no dia ou no evento para ver detalhes, marcar feito ou editar o que for seu.",
    },
    {
      id: "academic",
      targetId: "tutorial-calendar-academic",
      title: "Datas acadêmicas",
      body: "O painel ao lado (ou abaixo no celular) lista datas institucionais — matrícula, provas, recesso — vindas do calendário oficial.",
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
      id: "modes",
      targetId: "tutorial-mapa-toggle",
      title: "Grade ou grafo",
      body: "Alterne entre Grade (períodos em colunas) e Grafo (pré-requisitos em rede). No celular o grafo é otimizado para toque — sem abrir o perfil ao mexer no canvas.",
    },
    {
      id: "grid",
      targetId: "tutorial-mapa-grid",
      title: "Períodos e disciplinas",
      body: "Na Grade, cada coluna é um período. Toque ou clique numa disciplina para ver detalhes e pré-requisitos. Cores seguem o status acadêmico.",
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
      body: "O card de resumo mostra quantas horas você já cumpriu versus o total exigido pelo curso. O sino também avisa marcos (50% / 80% / 100%) por categoria.",
    },
    {
      id: "table",
      targetId: "tutorial-integralizacao-table",
      title: "Detalhe por categoria",
      body: "A tabela lista cada tipo de carga horária. Use o botão ? ao lado do título para o glossário de siglas CH e registre horas complementares quando precisar.",
    },
  ],
  simulador: [
    {
      id: "overview",
      targetId: null,
      title: "Montar grade",
      body: "Simule a matrícula do próximo semestre com turmas reais do SIGAA — conflitos de horário e corequisitos são validados aqui.",
    },
    {
      id: "sync",
      targetId: "tutorial-enrollment-sync",
      title: "Turmas ofertadas",
      body: "Toque em Atualizar / Buscar turmas para sincronizar a oferta. Só aparecem disciplinas que você ainda pode cursar neste semestre.",
    },
    {
      id: "sidebar",
      targetId: "tutorial-enrollment-sidebar",
      title: "Escolher turma",
      body: "Busque pelo apelido ou nome e filtre a lista. Clique numa turma para selecioná-la — variantes de horário expandem no mesmo card.",
    },
    {
      id: "schedule",
      targetId: "tutorial-enrollment-schedule",
      title: "Alocar na grade",
      body: "Com uma turma selecionada, clique nas células destacadas. Para remover, clique na célula ocupada ou use Limpar. No celular a grade fica compacta em colunas.",
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
      title: "Acesso gratuito",
      body: "O ACME HUB é gratuito — não há planos pagos nem PIX. Após o cadastro você já usa todas as funções acadêmicas.",
    },
  ],
};

/**
 * Mobile (navegador ≤768px) — mesma função, copy e ênfase adaptadas ao layout touch
 * (menu hambúrguer, stacks, sem sidebar do app nativo).
 */
export const PAGE_TUTORIALS_MOBILE: Record<PageTutorialId, PageTutorialStep[]> = {
  dashboard: [
    {
      id: "overview",
      targetId: null,
      title: "Dashboard no celular",
      body: "Tudo do semestre em uma coluna: indicadores, entregas, grade e cards. Role a página — o menu das outras telas fica no ícone ☰ no topo.",
    },
    {
      id: "nav",
      targetId: "nav-menu-mobile",
      title: "Menu",
      body: "Toque no ☰ para abrir Calendário, Disciplinas, Mapa, Integralização e Simulador. Não há barra lateral — só este menu.",
    },
    {
      id: "subjects",
      targetId: "tutorial-subjects-section",
      title: "Cards das disciplinas",
      body: "Cada card resume nota, faltas e risco. Toque no nome da matéria para abrir o detalhe.",
    },
    {
      id: "notifications",
      targetId: "notifications-bell",
      title: "Notificações",
      body: "O sino (ao lado do Sync) avisa notas/tarefas novas e eventos (cadastro, 1 dia antes e no dia). Itens sumidos do painel após 24h de vista.",
    },
    {
      id: "sync",
      targetId: "sync-sigaa",
      title: "Sincronizar",
      body: "Use Sync no topo para puxar dados do SIGAA. Vale a pena depois de provas ou mudanças no portal.",
    },
    {
      id: "profile",
      targetId: "profile-avatar",
      title: "Perfil",
      body: "Toque no avatar para contato, plano, preferências de notificação e último sync.",
    },
  ],
  disciplinas: [
    {
      id: "overview",
      targetId: null,
      title: "Disciplinas",
      body: "Lista do semestre em formato compacto no celular. Busque e filtre no topo; toque na matéria para abrir.",
    },
    {
      id: "filters",
      targetId: "tutorial-discipline-list",
      title: "Busca e filtros",
      body: "Filtros e busca ficam acima da lista. Em telas estreitas, role horizontalmente se os chips não couberem.",
    },
    {
      id: "open",
      targetId: "tutorial-discipline-row",
      title: "Abrir disciplina",
      body: "Toque na linha/card para notas, faltas, tarefas e grupo — o detalhe abre em tela cheia.",
    },
  ],
  "disciplina-detail": [
    {
      id: "overview",
      targetId: null,
      title: "Detalhe da matéria",
      body: "Abas e painéis empilhados no celular: notas, frequência e tarefas. Role para ver tudo.",
    },
    {
      id: "properties",
      targetId: "tutorial-discipline-properties",
      title: "Personalizar",
      body: "Apelido, cor e prioridade ficam no cabeçalho. Só mudam a exibição no ACME — o SIGAA não é alterado.",
    },
    {
      id: "simulate",
      targetId: "tutorial-simulate-btn",
      title: "Simular notas",
      body: "Na aba Notas, Simular testa cenários sem gravar no portal. Ideal para ver quanto falta para 60 pts.",
    },
    {
      id: "simulate-how",
      targetId: null,
      title: "Como funciona",
      body: "Olhe a coluna Necessário. Limpar simulação e Notas reais voltam ao que veio do sync.",
    },
  ],
  calendario: [
    {
      id: "overview",
      targetId: null,
      title: "Calendário no celular",
      body: "Filtros no topo, mês no meio e datas acadêmicas / lista abaixo — tudo em uma coluna com scroll.",
    },
    {
      id: "filters",
      targetId: "tutorial-calendar-filters",
      title: "Filtros",
      body: "Deslize os chips na horizontal para filtrar tarefas, provas e eventos.",
    },
    {
      id: "month",
      targetId: "tutorial-calendar-month",
      title: "Mês",
      body: "Toque no dia para ver o que acontece. Dá para adicionar evento manual e marcar entregas feitas.",
    },
    {
      id: "academic",
      targetId: "tutorial-calendar-academic",
      title: "Datas acadêmicas",
      body: "Mais abaixo: calendário oficial (matrícula, provas, recesso). O sino também lembra D-1 e no dia.",
    },
  ],
  mapa: [
    {
      id: "overview",
      targetId: null,
      title: "Mapa no celular",
      body: "Mesmo PPC do desktop, em tela cheia. Alterne Grade e Grafo no seletor abaixo do resumo.",
    },
    {
      id: "stats",
      targetId: "tutorial-mapa-stats",
      title: "Resumo",
      body: "Os números no topo mostram o progresso. Role para ver o mapa completo.",
    },
    {
      id: "modes",
      targetId: "tutorial-mapa-toggle",
      title: "Grade ou grafo",
      body: "Grade = períodos. Grafo = ligações de pré-requisito com gestos de toque (sem abrir o perfil ao arrastar).",
    },
    {
      id: "grid",
      targetId: "tutorial-mapa-grid",
      title: "Explorar",
      body: "Toque numa disciplina para detalhes. Cores = status (concluída, cursando, liberada, bloqueada).",
    },
  ],
  integralizacao: [
    {
      id: "overview",
      targetId: null,
      title: "Integralização",
      body: "No celular os cards e a tabela empilham: primeiro o total, depois categorias e o detalhe.",
    },
    {
      id: "summary",
      targetId: "tutorial-integralizacao-summary",
      title: "Progresso",
      body: "Veja quanto já cumpriu do currículo. Marcos de CH também aparecem no sino.",
    },
    {
      id: "table",
      targetId: "tutorial-integralizacao-table",
      title: "Categorias",
      body: "Role a tabela e use ? para o glossário. Cadastre horas complementares pelo botão da seção.",
    },
  ],
  simulador: [
    {
      id: "overview",
      targetId: null,
      title: "Simulador no celular",
      body: "Fluxo em coluna: sync de turmas → catálogo → grade compacta. Mesmas regras de choque e corequisito do desktop.",
    },
    {
      id: "sync",
      targetId: "tutorial-enrollment-sync",
      title: "Buscar turmas",
      body: "Atualize a oferta do SIGAA pelo botão no topo desta tela (não abre sync sozinho ao entrar).",
    },
    {
      id: "sidebar",
      targetId: "tutorial-enrollment-sidebar",
      title: "Catálogo",
      body: "Filtros e lista de turmas. Role os filtros na horizontal; toque na turma para selecionar.",
    },
    {
      id: "schedule",
      targetId: "tutorial-enrollment-schedule",
      title: "Grade",
      body: "Grade em grade compacta (2 colunas de horário). Toque nas células destacadas para alocar; toque de novo para remover.",
    },
    {
      id: "coreq",
      targetId: null,
      title: "Corequisitos",
      body: "Par teoria/lab precisa ficar junto — o app avisa se faltar a metade do par.",
    },
  ],
  planos: [
    {
      id: "overview",
      targetId: null,
      title: "Acesso gratuito",
      body: "O ACME HUB é gratuito no celular também — sem PIX nem renovação. Após o cadastro o app já está liberado.",
    },
  ],
};

/** @deprecated Use getPageTutorialSteps(id, { variant }) */
export const PAGE_TUTORIALS = PAGE_TUTORIALS_DESKTOP;

export function getPageTutorialSteps(
  id: PageTutorialId,
  options?: { variant?: PageTutorialVariant }
): PageTutorialStep[] {
  const variant = options?.variant ?? "desktop";
  if (variant === "mobile") {
    return PAGE_TUTORIALS_MOBILE[id];
  }
  return PAGE_TUTORIALS_DESKTOP[id];
}
