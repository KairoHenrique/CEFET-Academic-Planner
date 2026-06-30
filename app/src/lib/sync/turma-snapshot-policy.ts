import type { TurmaVirtualSnapshot } from "@/lib/scraper/types/turma-virtual";

function disciplinaHasPayload(
  disciplina: TurmaVirtualSnapshot["disciplinas"][number]
): boolean {
  return (
    disciplina.notas.length > 0 ||
    disciplina.faltas.length > 0 ||
    disciplina.tarefas.length > 0 ||
    disciplina.grupo.length > 0 ||
    Boolean(disciplina.professor?.trim()) ||
    disciplina.maxFaltas !== null
  );
}

/** Evita apagar notas/faltas quando o scrape retornou vazio. */
export function isTurmaSnapshotPersistable(
  snapshot: TurmaVirtualSnapshot
): boolean {
  if (snapshot.disciplinas.length === 0) return false;
  return snapshot.disciplinas.some(disciplinaHasPayload);
}
