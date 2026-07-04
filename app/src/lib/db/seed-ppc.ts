import db from "./index";
import { countDisciplinas, saveDisciplina, saveRequisito } from "./queries";
import { normalizeCefetCh } from "@/lib/disciplinas/cefet-ch";
import { resolvePpcEmenta } from "@/lib/disciplinas/resolve-ppc-ementa";
import { loadPpcSeedData, type PpcSeedItem } from "@/lib/db/ppc-seed-loader";

function withResolvedEmenta(item: PpcSeedItem): PpcSeedItem["disciplina"] {
  const { codigo, nome, periodo, tipo } = item.disciplina;
  const carga_horaria = normalizeCefetCh(item.disciplina.carga_horaria);
  return {
    codigo,
    nome,
    tipo,
    carga_horaria,
    periodo,
    ementa: resolvePpcEmenta(codigo, nome, carga_horaria),
  };
}

export function syncPpcEmentasToDb(): void {
  const data = loadPpcSeedData();

  const syncAll = db.transaction(() => {
    for (const item of data) {
      saveDisciplina(withResolvedEmenta(item));
    }
  });

  syncAll();
}

export function syncPpcRequisitosToDb(): void {
  const data = loadPpcSeedData();

  const syncAll = db.transaction(() => {
    db.prepare("DELETE FROM requisitos").run();

    for (const item of data) {
      for (const req of item.requisitos) {
        if (req.requisito_id === "-") continue;
        try {
          saveRequisito(req);
        } catch {
          // Requisito órfão no JSON — ignorado no sync.
        }
      }
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
    syncPpcRequisitosToDb();
  }

  return countDisciplinas();
}
