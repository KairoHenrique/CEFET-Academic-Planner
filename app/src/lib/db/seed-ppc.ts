import db from "./index";
import { countDisciplinas, saveDisciplina, saveRequisito } from "./queries";
import { normalizeCefetCh } from "@/lib/disciplinas/cefet-ch";
import { resolvePpcEmenta } from "@/lib/disciplinas/resolve-ppc-ementa";
import { loadPpcSeedData, type PpcSeedItem } from "@/lib/db/ppc-seed-loader";
import { resolveQueryCursoId } from "@/lib/db/resolve-query-curso-id";

function activeCursoId(): string {
  return resolveQueryCursoId();
}

function withResolvedEmenta(item: PpcSeedItem): PpcSeedItem["disciplina"] {
  const cursoId = activeCursoId();
  const { codigo, nome, periodo, tipo } = item.disciplina;
  const carga_horaria = normalizeCefetCh(item.disciplina.carga_horaria);
  return {
    codigo,
    nome,
    tipo,
    carga_horaria,
    periodo,
    ementa: resolvePpcEmenta(codigo, nome, carga_horaria, cursoId),
  };
}

export function syncPpcEmentasToDb(): void {
  const data = loadPpcSeedData(activeCursoId());

  const syncAll = db.transaction(() => {
    // Limpa requisitos antes para evitar falha de FOREIGN KEY de dependentes diretos
    db.prepare("DELETE FROM requisitos").run();

    // Remove todas as disciplinas canônicas antigas para evitar "vazamento/fusão" 
    // de PPCs quando o usuário troca de curso (ex: Computação -> Moda -> Mecatrônica).
    // Preserva as que já estão em uso pelo aluno para não quebrar chaves estrangeiras.
    db.prepare(`
      DELETE FROM disciplinas 
      WHERE codigo LIKE '%/%'
      AND codigo NOT IN (SELECT disciplina_id FROM historico)
      AND codigo NOT IN (SELECT disciplina_id FROM semestre_atual)
      AND codigo NOT IN (SELECT disciplina_id FROM notas)
      AND codigo NOT IN (SELECT disciplina_id FROM faltas)
      AND codigo NOT IN (SELECT disciplina_id FROM tarefas)
    `).run();

    for (const item of data) {
      saveDisciplina(withResolvedEmenta(item));
    }
  });

  syncAll();
}

export function syncPpcRequisitosToDb(): void {
  const data = loadPpcSeedData(activeCursoId());

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
  const data = loadPpcSeedData(activeCursoId());

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
