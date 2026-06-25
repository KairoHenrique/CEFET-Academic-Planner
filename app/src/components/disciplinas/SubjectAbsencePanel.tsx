"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  attendanceStatusLabels,
  type AttendanceRecord,
  type AttendanceStatus,
} from "@/config/mock/attendance";

interface SubjectAbsencePanelProps {
  absences: number;
  maxAbsences: number;
  daysRemaining: number;
  records: AttendanceRecord[];
}

const statusBadge: Record<AttendanceStatus, string> = {
  presente: "success",
  falta: "danger",
  nao_registrada: "warning",
};

export function SubjectAbsencePanel({
  absences,
  maxAbsences,
  daysRemaining,
  records,
}: SubjectAbsencePanelProps) {
  const ratio = maxAbsences > 0 ? (absences / maxAbsences) * 100 : 0;
  const zone =
    ratio >= 80 ? "danger" : ratio >= 50 ? "warning" : "success";
  const label =
    ratio >= 80 ? "Crítico" : ratio >= 50 ? "Atenção" : "Seguro";

  return (
    <div className="card card-full-height">
      <SectionHeader
        title="Frequência"
        icon="clipboard"
        badge={<span className={`badge ${zone}`}>{label}</span>}
      />

      <div className="absence-summary">
        <span className="absence-count">
          {absences}
          <span className="subject-stat-max"> / {maxAbsences}</span>
        </span>
        <p className="absence-detail">
          faltas permitidas · <strong>{daysRemaining}</strong> dias de aula restantes
        </p>
      </div>

      <div className="progress-bar progress-bar-lg">
        <div
          className={`progress-bar-fill ${zone}`}
          style={{ width: `${Math.min(ratio, 100)}%` }}
        />
      </div>

      <div className="data-table-wrap attendance-table-wrap">
        <table className="data-table attendance-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.date}>
                <td>{record.date}</td>
                <td>
                  <span className={`badge ${statusBadge[record.status]}`}>
                    {attendanceStatusLabels[record.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
