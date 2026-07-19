import { scheduleCellKey } from "./turma-schedule-placement";
import type { SimuladorChoquePair } from "../types";

export function resolveConflictCellKeys(
  conflicts: readonly SimuladorChoquePair[]
): Set<string> {
  const keys = new Set<string>();

  for (const conflict of conflicts) {
    for (const cell of conflict.cells) {
      keys.add(scheduleCellKey(cell.dayIdx, cell.slotIdx));
    }
  }

  return keys;
}

export function resolveConflictTurmaIds(
  conflicts: readonly SimuladorChoquePair[]
): Set<string> {
  const ids = new Set<string>();

  for (const conflict of conflicts) {
    ids.add(conflict.turmaSigaaIdA);
    ids.add(conflict.turmaSigaaIdB);
  }

  return ids;
}
