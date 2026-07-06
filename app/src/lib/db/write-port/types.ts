import type { TurmaOfertadaRow } from "@/lib/types/db";

/**
 * Escrita do catálogo de turmas ofertadas (robô B67 → simulador).
 *
 * Contrato assíncrono por design: o adapter SQLite resolve de imediato
 * (better-sqlite3 é síncrono), enquanto o adapter Postgres (B72b) executa
 * I/O de rede. Assim o pipeline de persistência não precisa ser reescrito
 * quando o backend muda — apenas o adapter concreto.
 */
export interface TurmasOfertadasWriter {
  /** Remove as turmas do semestre antes de regravar o snapshot. */
  clearForSemestre(semestre: string): Promise<void>;
  /** Upsert idempotente por `turma_sigaa_id`. */
  save(row: Omit<TurmaOfertadaRow, "id">): Promise<void>;
}

/**
 * Porta de escrita unificada do planner (Repository Port + Adapter).
 *
 * A leitura já é dual (`queries.ts` SQLite · `queries-read.ts` Postgres);
 * esta porta torna a **escrita** dual também. Segmentada por domínio (ISP):
 * cada vertical (turmas, portal, histórico, calendário, turma virtual)
 * é adicionada conforme as sub-tasks B72b/B72c.
 */
export interface PlannerWritePort {
  readonly turmasOfertadas: TurmasOfertadasWriter;
}
