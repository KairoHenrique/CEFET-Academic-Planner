import type { TurmaOfertadaEnrollmentStatus } from "@/lib/types/turmas-ofertadas-api";

export interface SimuladorElegibilidadeItem {
  code: string;
  name: string;
  /** Pode cursar no próximo semestre (inclui condicional — pré-req em andamento). */
  canEnroll: boolean;
  status: TurmaOfertadaEnrollmentStatus;
  pendingPrereqCodes: string[];
  reason: string | null;
}

export interface SimuladorElegibilidadeResponse {
  ok: true;
  semestre: string;
  items: SimuladorElegibilidadeItem[];
}

export interface SimuladorChoqueCell {
  dayIdx: number;
  slotIdx: number;
  horario: string;
}

export interface SimuladorChoquePair {
  turmaSigaaIdA: string;
  codeA: string;
  nameA: string;
  turmaSigaaIdB: string;
  codeB: string;
  nameB: string;
  cells: SimuladorChoqueCell[];
}

export interface SimuladorChoquesRequestBody {
  turmaSigaaIds: string[];
  /** Turma hipotética a validar contra a grade (opcional). */
  candidateTurmaSigaaId?: string;
}

export interface SimuladorChoquesResponse {
  ok: true;
  semestre: string;
  hasConflicts: boolean;
  conflicts: SimuladorChoquePair[];
  invalidTurmaIds: string[];
}

export interface SimuladorSimulationPayload {
  semestre: string;
  turmaSigaaIds: string[];
}

export interface SimuladorSimulationSummary {
  id: string;
  titulo: string;
  semestre: string;
  turmaCount: number;
  totalCh: number;
  createdAt: string;
  updatedAt: string;
}

export interface SimuladorSimulationExportCourse {
  turmaSigaaId: string;
  code: string;
  name: string;
  turmaCodigo: string | null;
  horarios: string[];
  professor: string;
  room: string;
  ch: number;
}

export interface SimuladorSimulationExport {
  semestre: string;
  generatedAt: string;
  titulo: string;
  courses: SimuladorSimulationExportCourse[];
  totalCh: number;
}

export interface SimuladorSimulationDetail extends SimuladorSimulationSummary {
  payload: SimuladorSimulationPayload;
  export: SimuladorSimulationExport;
}

export interface SimuladorSimulacoesListResponse {
  ok: true;
  items: SimuladorSimulationSummary[];
}

export interface SimuladorSaveSimulationRequestBody {
  titulo: string;
  turmaSigaaIds: string[];
  semestre?: string;
}

export interface SimuladorSaveSimulationResponse {
  ok: true;
  simulation: SimuladorSimulationDetail;
}
