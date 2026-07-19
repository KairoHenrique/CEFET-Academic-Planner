/**
 * Tutoriais do app Android — paridade funcional com o site (`PAGE_TUTORIALS_MOBILE`),
 * copy adaptada à casca nativa (F28Navbar + drawer).
 */

export type PageTutorialId =
  | "dashboard"
  | "disciplinas"
  | "disciplina-detail"
  | "calendario"
  | "mapa"
  | "integralizacao"
  | "simulador"
  | "planos"
  | "perfil"
  | "notificacoes";

export interface PageTutorialStep {
  id: string;
  title: string;
  body: string;
}

export const PAGE_TUTORIALS_NATIVE: Record<PageTutorialId, PageTutorialStep[]> = {
  dashboard: [
    {
      id: "overview",
      title: "Dashboard",
      body: "Sua tela inicial: rendimento, entregas, grade da semana e cards das disciplinas do semestre.",
    },
    {
      id: "nav",
      title: "Menu",
      body: "Toque no ☰ no canto superior para abrir Calendário, Disciplinas, Mapa, Integralização, Montar Grade, Planos e este Tutorial.",
    },
    {
      id: "subjects",
      title: "Cards das disciplinas",
      body: "Cada card resume nota, faltas e risco. Toque no nome para abrir o detalhe completo.",
    },
    {
      id: "notifications",
      title: "Notificações",
      body: "O sino no topo avisa notas/tarefas novas e eventos (ao cadastrar, 1 dia antes e no dia). O painel some 24h depois de visto.",
    },
    {
      id: "sync",
      title: "Sincronizar",
      body: "O ícone de sync no topo puxa dados do SIGAA (notas, faltas, tarefas, calendário). Use depois de provas ou mudanças no portal.",
    },
    {
      id: "profile",
      title: "Perfil",
      body: "Toque no avatar (iniciais) para contato, plano, preferências de notificação e último sync.",
    },
  ],
  disciplinas: [
    {
      id: "overview",
      title: "Disciplinas",
      body: "Lista do semestre: prioridade, professor, horário, sala, nota e faltas.",
    },
    {
      id: "filters",
      title: "Busca e filtros",
      body: "Use a busca e os chips (Todas, Risco, Crítico…) no topo para achar uma matéria rápido.",
    },
    {
      id: "open",
      title: "Abrir disciplina",
      body: "Toque no card/linha para ver notas, frequência, tarefas, ementa e grupo da turma.",
    },
  ],
  "disciplina-detail": [
    {
      id: "overview",
      title: "Detalhe da matéria",
      body: "Acompanhe notas, faltas, tarefas e dados da turma sincronizados com o SIGAA.",
    },
    {
      id: "properties",
      title: "Personalizar",
      body: "Apelido, cor e prioridade ficam no cabeçalho. Só mudam a exibição no ACME — o SIGAA não é alterado.",
    },
    {
      id: "simulate",
      title: "Simular notas",
      body: "Na aba Notas, use Simular para testar cenários sem gravar no portal. Veja quanto falta para 60 pts.",
    },
    {
      id: "simulate-how",
      title: "Como funciona",
      body: "A coluna Necessário mostra o mínimo em cada prova. Limpar simulação e Notas reais voltam ao sync.",
    },
  ],
  calendario: [
    {
      id: "overview",
      title: "Calendário",
      body: "Agenda do semestre: tarefas, provas, eventos manuais e datas acadêmicas oficiais do CEFET.",
    },
    {
      id: "filters",
      title: "Filtros",
      body: "Deslize os chips na horizontal para filtrar tarefas, provas e eventos.",
    },
    {
      id: "month",
      title: "Mês",
      body: "Toque no dia para ver o que acontece. Dá para adicionar evento manual e marcar entregas feitas.",
    },
    {
      id: "academic",
      title: "Datas acadêmicas",
      body: "Mais abaixo: calendário oficial (matrícula, provas, recesso). O sino também lembra D-1 e no dia.",
    },
  ],
  mapa: [
    {
      id: "overview",
      title: "Mapa do curso",
      body: "Grade curricular do PPC com status: concluída, cursando, liberada ou bloqueada por pré-requisito.",
    },
    {
      id: "stats",
      title: "Resumo",
      body: "Os números no topo mostram o progresso. Role para ver o mapa completo.",
    },
    {
      id: "modes",
      title: "Grade ou grafo",
      body: "Grade = períodos em colunas. Grafo = ligações de pré-requisito — arraste com um dedo e use pinça para zoom (tela cheia / paisagem).",
    },
    {
      id: "grid",
      title: "Explorar",
      body: "Toque numa disciplina para detalhes. Cores = status acadêmico.",
    },
  ],
  integralizacao: [
    {
      id: "overview",
      title: "Integralização",
      body: "Acompanhe horas obrigatórias e complementares do PPC e registre atividades validadas.",
    },
    {
      id: "summary",
      title: "Progresso",
      body: "Veja quanto já cumpriu do currículo. Marcos de CH também aparecem no sino.",
    },
    {
      id: "table",
      title: "Categorias",
      body: "Role a lista e use ? para o glossário. Cadastre horas complementares pelo botão da seção.",
    },
  ],
  simulador: [
    {
      id: "overview",
      title: "Montar grade",
      body: "Simule a matrícula com turmas reais do SIGAA — conflitos de horário e corequisitos são validados aqui.",
    },
    {
      id: "sync",
      title: "Buscar turmas",
      body: "Atualize a oferta do SIGAA pelo botão desta tela (não sincroniza sozinho ao entrar).",
    },
    {
      id: "catalog",
      title: "Catálogo",
      body: "Filtros e lista de turmas. Toque numa turma (ou grupo com vários horários) para selecionar.",
    },
    {
      id: "schedule",
      title: "Grade",
      body: "Toque nas células destacadas para alocar. Se o co-req tiver 2 horários, as duas opções aparecem — escolha tocando na grade.",
    },
    {
      id: "coreq",
      title: "Corequisitos",
      body: "Par teoria/lab precisa ficar junto — o app avisa se faltar a metade do par.",
    },
  ],
  planos: [
    {
      id: "overview",
      title: "Planos",
      body: "Escolha o período (trimestre, semestre, anual…). O trial de 7 dias vem no cadastro; depois você renova ou assina via PIX.",
    },
    {
      id: "checkout",
      title: "Pagar com PIX",
      body: "Selecione o plano e confirme — o ACME gera o QR / copia-e-cola. Após o pagamento, o acesso libera automaticamente.",
    },
    {
      id: "gift",
      title: "Chave gift",
      body: "Se você recebeu um código de presente, resgate nesta tela para ativar o plano sem PIX.",
    },
  ],
  perfil: [
    {
      id: "overview",
      title: "Perfil",
      body: "Dados da conta, contato, curso, último sync e preferências de notificação.",
    },
    {
      id: "prefs",
      title: "Preferências",
      body: "Ajuste o que quiser receber no sino / push. As mudanças sincronizam com a nuvem.",
    },
    {
      id: "plan",
      title: "Assinatura",
      body: "Veja seu plano atual. Para renovar ou mudar, use Planos no menu.",
    },
  ],
  notificacoes: [
    {
      id: "overview",
      title: "Notificações",
      body: "Feed do sino: tarefas, notas, eventos e marcos acadêmicos.",
    },
    {
      id: "timing",
      title: "Quando avisamos",
      body: "Eventos e datas: ao cadastrar/aparecer, 1 dia antes e no dia. Itens somem do painel 24h depois de vistos.",
    },
  ],
};

const ROUTE_TO_TUTORIAL: Record<string, PageTutorialId> = {
  Dashboard: "dashboard",
  Calendario: "calendario",
  Disciplinas: "disciplinas",
  DisciplinaDetail: "disciplina-detail",
  Mapa: "mapa",
  Integralizacao: "integralizacao",
  Simulador: "simulador",
  Planos: "planos",
  PlanosPix: "planos",
  Perfil: "perfil",
  Notificacoes: "notificacoes",
};

export function tutorialIdForRoute(route: string): PageTutorialId {
  return ROUTE_TO_TUTORIAL[route] ?? "dashboard";
}

export function getNativeTutorialSteps(id: PageTutorialId): PageTutorialStep[] {
  return PAGE_TUTORIALS_NATIVE[id] ?? PAGE_TUTORIALS_NATIVE.dashboard;
}
