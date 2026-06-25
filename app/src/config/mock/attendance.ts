export type { AttendanceStatus, AttendanceRecord, AttendanceSummary } from "@/lib/types/attendance";
export { attendanceStatusLabels } from "@/lib/types/attendance";
import type { AttendanceRecord, AttendanceSummary } from "@/lib/types/attendance";

const engSoftAttendance: AttendanceRecord[] = [
  { date: "10/02/2026", status: "presente" },
  { date: "12/02/2026", status: "presente" },
  { date: "12/03/2026", status: "falta" },
  { date: "19/03/2026", status: "falta" },
  { date: "02/04/2026", status: "falta" },
  { date: "16/04/2026", status: "falta" },
  { date: "23/04/2026", status: "presente" },
  { date: "30/04/2026", status: "falta" },
  { date: "07/05/2026", status: "falta" },
  { date: "14/05/2026", status: "falta" },
  { date: "21/05/2026", status: "falta" },
  { date: "28/05/2026", status: "nao_registrada" },
];

const laociAttendance: AttendanceRecord[] = [
  { date: "11/02/2026", status: "presente" },
  { date: "18/02/2026", status: "presente" },
  { date: "12/03/2026", status: "falta" },
  { date: "19/03/2026", status: "falta" },
  { date: "02/04/2026", status: "falta" },
  { date: "16/04/2026", status: "falta" },
  { date: "23/04/2026", status: "presente" },
  { date: "30/04/2026", status: "nao_registrada" },
];

const defaultAttendance: AttendanceRecord[] = [
  { date: "10/02/2026", status: "presente" },
  { date: "12/02/2026", status: "presente" },
  { date: "19/02/2026", status: "presente" },
  { date: "26/02/2026", status: "nao_registrada" },
];

const attendanceByCode: Record<string, AttendanceSummary> = {
  "ENG-SOFT": { records: engSoftAttendance, daysRemaining: 12 },
  LAOCI: { records: laociAttendance, daysRemaining: 8 },
  AEDI: { records: defaultAttendance, daysRemaining: 14 },
  AOCI: { records: defaultAttendance, daysRemaining: 14 },
  LAEDI: { records: defaultAttendance.slice(0, 3), daysRemaining: 10 },
};

export function getAttendanceByCode(code: string): AttendanceSummary {
  return (
    attendanceByCode[code.toUpperCase()] ?? {
      records: defaultAttendance,
      daysRemaining: 10,
    }
  );
}

