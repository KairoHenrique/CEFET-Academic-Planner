export type AttendanceStatus = "presente" | "falta" | "nao_registrada";

export interface AttendanceRecord {
  date: string;
  status: AttendanceStatus;
}

export interface AttendanceSummary {
  records: AttendanceRecord[];
  daysRemaining: number;
}

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  presente: "Presente",
  falta: "Falta",
  nao_registrada: "Não registrada",
};
