import type { IntegralizacaoQueryDeps } from "@/lib/integralizacao/build-integralizacao-from-queries";
import * as pg from "@/lib/db/postgres/queries-read";

export const postgresQueryDeps: IntegralizacaoQueryDeps = {
  getAluno: pg.pgGetAluno,
  getIntegralizacao: pg.pgGetIntegralizacao,
  getDisciplinas: pg.pgGetDisciplinas,
  getHistorico: pg.pgGetHistorico,
  getSemestreAtual: pg.pgGetSemestreAtual,
  getTarefas: pg.pgGetTarefas,
};
