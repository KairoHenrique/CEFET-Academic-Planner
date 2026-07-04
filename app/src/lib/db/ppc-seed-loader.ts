import fs from "node:fs";
import path from "node:path";

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

export function loadPpcSeedData(): PpcSeedItem[] {
  const dataPath = path.join(
    process.cwd(),
    "src",
    "config",
    "mock",
    "disciplinas_db.json"
  );
  const rawData = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(rawData) as PpcSeedItem[];
}
