import type { FaltaRow } from "@/lib/types/db";
import type { AttendanceSummary } from "@/lib/types/attendance";
import { formatIsoToBr } from "@/lib/tasks/dates";

function sumAbsenceQuantidade(records: FaltaRow[]): number {
  return records.reduce(
    (total, row) =>
      row.status === "falta"
        ? total + Math.max(1, row.quantidade ?? 1)
        : total,
    0
  );
}

export function buildAttendanceSummary(
  records: FaltaRow[],
  maxAbsences: number
): AttendanceSummary {
  const absenceCount = sumAbsenceQuantidade(records);
  const daysRemaining = Math.max(0, maxAbsences - absenceCount);

  return {
    records: records.map((row) => ({
      id: row.id,
      date: formatIsoToBr(row.data),
      status: row.status,
      quantidade: row.quantidade ?? 0,
    })),
    daysRemaining,
  };
}
