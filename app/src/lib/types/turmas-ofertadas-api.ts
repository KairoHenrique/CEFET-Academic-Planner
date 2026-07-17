export type TurmaOfertadaSituacaoApi = "atendida" | "pendente";
export type TurmaOfertadaCategoriaApi = "curso" | "optativa";

export interface TurmaOfertadaSlot {
  day: number;
  slot: number;
}

export type TurmaOfertadaEnrollmentStatus =
  | "done"
  | "unlocked"
  | "conditional"
  | "locked";

export type TurmaPrerequisiteHint = "conditional" | null;

export interface TurmasOfertadasEnrollmentContext {
  completedDisciplinaCodes: string[];
  coRequisitos: Record<string, string[]>;
  /** Nome PPC por código normalizado — resolve pendências fora do catálogo de turmas. */
  disciplinaNames: Record<string, string>;
}

export interface TurmaOfertadaCourse {
  turmaSigaaId: string;
  code: string;
  name: string;
  /** Apelido único derivado do nome (AEDI, VISCOMP…). */
  shortLabel?: string;
  status: TurmaOfertadaEnrollmentStatus;
  /** Pré-requisitos ainda em andamento no semestre atual. */
  pendingPrereqCodes: string[];
  /** Indica turma que talvez seja liberada após aprovação de pré-requisitos. */
  prerequisiteHint: TurmaPrerequisiteHint;
  /** Corequisitos exigidos pelo PPC (pares na mesma grade). */
  coRequisitoCodes: string[];
  /** Corequisitos já cumpridos via histórico — não exigem par na grade. */
  waivedCoRequisitoCodes: string[];
  color: string;
  room: string;
  professor: string;
  ch: number;
  turmaCodigo: string | null;
  semestre: string;
  codigoHorario: string | null;
  vagas: number | null;
  slots: TurmaOfertadaSlot[];
  situacao: TurmaOfertadaSituacaoApi;
  categoria: TurmaOfertadaCategoriaApi;
  /** Bloqueia auto-posicionamento — só quando não há horário parseável no SIGAA. */
  scheduleBlocker: boolean;
  scheduleWarningMessage: string | null;
  sigaaComponente: string | null;
  departamento: string | null;
}

export interface TurmasOfertadasResponse {
  semestre: string;
  syncedAt: string | null;
  enrollmentContext: TurmasOfertadasEnrollmentContext;
  /** Disciplinas da grade / formação do curso (PPC ≠ optativa). */
  curso: TurmaOfertadaCourse[];
  /** Optativas e tópicos especiais (PPC optativa/eletiva ou prefixo GT). */
  optativas: TurmaOfertadaCourse[];
  /** Lista plana — compatibilidade; mesma ordem curso + optativas. */
  courses: TurmaOfertadaCourse[];
  empty: boolean;
}

export interface TurmasOfertadasSyncResponse {
  ok: boolean;
  skipped?: boolean;
  partial?: boolean;
  /** Dados de exemplo — SIGAA indisponível ou lista não encontrada. */
  usedExampleData?: boolean;
  rowsWritten: number;
  message: string;
  /** Cloud: job enfileirado no worker do PC — o client deve aguardar o `jobId`. */
  cloud?: boolean;
  jobId?: string;
}

export const TURMA_SCHEDULE_BLOCKER_MESSAGE =
  "Sem horário no SIGAA — clique em um slot vazio para simular manualmente.";

export const TURMA_SCHEDULE_UNCERTAIN_MESSAGE =
  "Horário informado no SIGAA, mas pode não estar 100% definido. Confirme antes da matrícula.";

export const TURMA_PREREQ_CONDITIONAL_MESSAGE =
  "Depende de disciplinas que você está cursando neste semestre. Só será possível se forem aprovadas.";
