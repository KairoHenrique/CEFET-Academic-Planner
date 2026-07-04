export type TurmaOfertadaSituacao = "atendida" | "pendente";

export interface TurmaOfertadaItem {
  turmaSigaaId: string;
  sigaaComponente: string | null;
  codigoDisciplina: string;
  nome: string;
  turmaCodigo: string | null;
  semestre: string;
  codigoHorario: string | null;
  horarioExibicao: string | null;
  local: string | null;
  professor: string | null;
  vagas: number | null;
  vagasOcupadas: number | null;
  cargaHoraria: number | null;
  situacao: TurmaOfertadaSituacao;
  tipoTurma: string | null;
  departamento: string | null;
  horarioIndefinido: boolean;
}

export interface TurmasOfertadasSnapshot {
  scrapedAt: string;
  semestreAlvo: string;
  turmas: TurmaOfertadaItem[];
  unavailable?: boolean;
  unavailableReason?: string;
}
