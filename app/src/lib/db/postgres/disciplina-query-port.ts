import type { DisciplinaDetailQueryDeps } from "@/lib/disciplinas/build-disciplina-detail-async";
import * as pg from "@/lib/db/postgres/queries-read";

export const postgresDisciplinaDetailDeps: DisciplinaDetailQueryDeps = {
  getSemestreAtualByCodigo: pg.pgGetSemestreAtualByCodigo,
  getDisciplinaByCodigo: pg.pgGetDisciplinaByCodigo,
  getFaltasByDisciplina: pg.pgGetFaltasByDisciplina,
  getGrupoByDisciplina: pg.pgGetGrupoByDisciplina,
  getTarefasByDisciplina: pg.pgGetTarefasByDisciplina,
};
