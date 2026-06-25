import type { FaltaRow } from "@/lib/types/db";
import type { AttendanceSummary } from "@/lib/types/attendance";

export function buildAttendanceSummary(
  records: FaltaRow[],
  maxAbsences: number
): AttendanceSummary {
  const absenceCount = records.filter((row) => row.status === "falta").length;
  const daysRemaining = Math.max(
    0,
    Math.ceil((maxAbsences - absenceCount) / 2)
  );

  return {
    records: records.map((row) => ({
      date: row.data,
      status: row.status,
    })),
    daysRemaining,
  };
}
