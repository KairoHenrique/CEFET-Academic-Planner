import type { HistoricoSnapshot } from "@/lib/scraper/types/historico";

const FINAL_SITUACOES = new Set([
  "APR",
  "APRN",
  "APROVADO",
  "REP",
  "REPF",
  "REPMF",
  "REPN",
  "REPNF",
  "REPROVADO",
  "TRANC",
  "TRANCADO",
  "DISP",
  "DISPENSADO",
  "CANC",
  "CANCELADO",
  "CUMP",
  "CUMPRIDO",
  "TRANS",
  "INCORP",
  "INCORPORADO",
]);

export function countPersistableHistoricoDisciplinas(
  snapshot: HistoricoSnapshot
): number {
  return snapshot.disciplinas.filter((entry) =>
    FINAL_SITUACOES.has(entry.situacao.toUpperCase())
  ).length;
}

/** Snapshot com ao menos uma disciplina de status final — seguro para replace em `historico`. */
export function isHistoricoSnapshotPersistable(
  snapshot: HistoricoSnapshot
): boolean {
  return countPersistableHistoricoDisciplinas(snapshot) > 0;
}
