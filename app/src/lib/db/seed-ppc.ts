import db from "./index";
import path from "path";
import fs from "fs";
import { countDisciplinas, saveDisciplina, saveRequisito } from "./queries";
import { resolvePpcEmenta } from "@/lib/disciplinas/resolve-ppc-ementa";

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

function loadPpcSeedData(): PpcSeedItem[] {
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

function withResolvedEmenta(item: PpcSeedItem): PpcSeedItem["disciplina"] {
  const { codigo, nome, carga_horaria, periodo, tipo } = item.disciplina;
  return {
    codigo,
    nome,
    tipo,
    carga_horaria,
    periodo,
    ementa: resolvePpcEmenta(codigo, nome, carga_horaria, periodo),
  };
}

export function syncPpcEmentasToDb(): void {
  const data = loadPpcSeedData();
  const update = db.prepare(
    "UPDATE disciplinas SET ementa = @ementa WHERE codigo = @codigo"
  );

  const syncAll = db.transaction(() => {
    for (const item of data) {
      const disciplina = withResolvedEmenta(item);
      update.run(disciplina);
    }
  });

  syncAll();
}

export function seedPpcIfEmpty(): number {
  const data = loadPpcSeedData();

  if (countDisciplinas() === 0) {
    const insertAll = db.transaction(() => {
      for (const item of data) {
        saveDisciplina(withResolvedEmenta(item));
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
  } else {
    syncPpcEmentasToDb();
  }

  return countDisciplinas();
}
