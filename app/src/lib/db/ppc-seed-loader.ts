import fs from "node:fs";
import path from "node:path";
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

export function loadPpcSeedData(
  cursoId: AppCursoId | string = DEFAULT_CURSO_ID
): PpcSeedItem[] {
  const fileName = resolvePpcSeedFileName(cursoId);
  const dataPath = path.join(
    process.cwd(),
    "src",
    "config",
    "mock",
    fileName
  );
  const rawData = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(rawData) as PpcSeedItem[];
}
