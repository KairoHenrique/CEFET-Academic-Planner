export interface CalendarioAcademicoEvento {
  evento: string;
  dataInicio: string;
  dataFim: string | null;
  semestre: string | null;
}

export interface CalendarioAcademicoSnapshot {
  scrapedAt: string;
  semestreAlvo: string[];
  eventos: CalendarioAcademicoEvento[];
  /** SIGAA sem publicação ou menu indisponível — não apagar dados locais. */
  unavailable?: boolean;
  unavailableReason?: string;
}
