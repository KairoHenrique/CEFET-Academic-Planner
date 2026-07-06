import {
  clearTurmasOfertadasForSemestre as sqliteClearTurmasOfertadasForSemestre,
  saveTurmaOfertada as sqliteSaveTurmaOfertada,
} from "@/lib/db/queries";
import type { PlannerWritePort, TurmasOfertadasWriter } from "./types";

/**
 * Adapter SQLite — embrulha as funções síncronas de `queries.ts` na porta
 * assíncrona. Comportamento local idêntico ao anterior (better-sqlite3).
 */
const turmasOfertadas: TurmasOfertadasWriter = {
  async clearForSemestre(semestre) {
    sqliteClearTurmasOfertadasForSemestre(semestre);
  },
  async save(row) {
    sqliteSaveTurmaOfertada(row);
  },
};

export const sqliteWritePort: PlannerWritePort = {
  turmasOfertadas,
};
