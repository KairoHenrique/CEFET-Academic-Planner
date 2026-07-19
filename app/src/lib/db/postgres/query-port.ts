import type { IntegralizacaoQueryDeps } from "@/lib/integralizacao/build-integralizacao-from-queries";
import type { MapaQueryDeps } from "@/lib/mapa/build-mapa";
import * as pg from "@/lib/db/postgres/queries-read";
import { pgReadSigaaIntegralizacaoResumo } from "@/lib/db/postgres/pg-sigaa-config";

export const postgresQueryDeps: IntegralizacaoQueryDeps = {
  getAluno: pg.pgGetAluno,
  getIntegralizacao: pg.pgGetIntegralizacao,
  getDisciplinas: pg.pgGetDisciplinas,
  getHistorico: pg.pgGetHistorico,
  getSemestreAtual: pg.pgGetSemestreAtual,
  getTarefas: pg.pgGetTarefas,
  getSigaaResumo: pgReadSigaaIntegralizacaoResumo,
  getAllNotas: pg.pgGetAllNotas,
  getAllFaltas: pg.pgGetAllFaltas,
};

export const postgresMapaQueryDeps: MapaQueryDeps = {
  getAluno: pg.pgGetAluno,
  getDisciplinas: pg.pgGetDisciplinas,
  getSemestreAtual: pg.pgGetSemestreAtual,
  getHistorico: pg.pgGetHistorico,
  getRequisitos: pg.pgGetRequisitos,
  getIntegralizacao: pg.pgGetIntegralizacao,
  getAllNotas: pg.pgGetAllNotas,
};
