import type { IntegralizacaoQueryDeps } from "@/lib/integralizacao/build-integralizacao-from-queries";
import type { MapaQueryDeps } from "@/lib/mapa/build-mapa";
import * as pg from "@/lib/db/postgres/queries-read";

export const postgresQueryDeps: IntegralizacaoQueryDeps = {
  getAluno: pg.pgGetAluno,
  getIntegralizacao: pg.pgGetIntegralizacao,
  getDisciplinas: pg.pgGetDisciplinas,
  getHistorico: pg.pgGetHistorico,
  getSemestreAtual: pg.pgGetSemestreAtual,
  getTarefas: pg.pgGetTarefas,
};

export const postgresMapaQueryDeps: MapaQueryDeps = {
  getAluno: pg.pgGetAluno,
  getDisciplinas: pg.pgGetDisciplinas,
  getSemestreAtual: pg.pgGetSemestreAtual,
  getHistorico: pg.pgGetHistorico,
  getRequisitos: pg.pgGetRequisitos,
  getIntegralizacao: pg.pgGetIntegralizacao,
};
