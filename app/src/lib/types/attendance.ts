export type AttendanceStatus = "presente" | "falta" | "nao_registrada";

export interface AttendanceRecord {
  id: number;
  date: string;
  status: AttendanceStatus;
  quantidade?: number;
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
