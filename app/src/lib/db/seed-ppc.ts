import db from "./index";
import path from "path";
import fs from "fs";
import { countDisciplinas, saveDisciplina, saveRequisito } from "./queries";

interface PpcSeedItem {
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

export function seedPpcIfEmpty(): number {
  if (countDisciplinas() > 0) {
    return countDisciplinas();
  }

  const dataPath = path.join(
    process.cwd(),
    "src",
    "config",
    "mock",
    "disciplinas_db.json"
  );
  const rawData = fs.readFileSync(dataPath, "utf-8");
  const data = JSON.parse(rawData) as PpcSeedItem[];

  const insertAll = db.transaction(() => {
    for (const item of data) {
      saveDisciplina(item.disciplina);
    }
    for (const item of data) {
      for (const req of item.requisitos) {
        if (req.requisito_id === "-") continue;
        try {
          saveRequisito(req);
        } catch {
          // Requisito órfão no JSON — ignorado no seed inicial.
        }
      }
    }
  });

  insertAll();
  return data.length;
}
