
import type { AppCursoId } from "@/lib/auth/account/types";
import { isAppCursoId } from "@/lib/auth/account/curso-catalog";
import { DEFAULT_CURSO_ID } from "@/lib/db/backend/config";

export interface PpcSeedItem {
  disciplina: {
    codigo: string;
    nome: string;
    tipo: string;
    carga_horaria: number;
    periodo: number;
    ementa: string;
  };
  requisitos: Array<{
    disciplina_id: string;
    requisito_id: string;
    tipo: "pre" | "co";
  }>;
}

const SEED_FILE_BY_CURSO: Record<AppCursoId, string> = {
  "eng-computacao": "disciplinas_db.json",
  "eng-mecatronica": "disciplinas_db_eng-mecatronica.json",
  "design-moda": "disciplinas_db_design-moda.json",
};

export function resolvePpcSeedFileName(
  cursoId: AppCursoId | string = DEFAULT_CURSO_ID
): string {
  if (isAppCursoId(cursoId)) {
    return SEED_FILE_BY_CURSO[cursoId];
  }
  return SEED_FILE_BY_CURSO["eng-computacao"];
}

import engComp from "@/config/mock/disciplinas_db.json";
import engMeca from "@/config/mock/disciplinas_db_eng-mecatronica.json";
import designModa from "@/config/mock/disciplinas_db_design-moda.json";

export function loadPpcSeedData(
  cursoId: AppCursoId | string = DEFAULT_CURSO_ID
): PpcSeedItem[] {
  if (cursoId === "eng-mecatronica") return engMeca as PpcSeedItem[];
  if (cursoId === "design-moda") return designModa as PpcSeedItem[];
  return engComp as PpcSeedItem[];
}
