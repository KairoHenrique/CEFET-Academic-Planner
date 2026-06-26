"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Modal } from "@/components/ui/Modal";
import {
  attendanceStatusLabels,
  type AttendanceRecord,
  type AttendanceStatus,
} from "@/lib/types/attendance";
import { useSubjectAttendance } from "@/hooks/useSubjectAttendance";

interface SubjectAbsencePanelProps {
  subjectCode: string;
  absences: number;
  maxAbsences: number;
  daysRemaining: number;
  records: AttendanceRecord[];
  expandList?: boolean;
  panelHeight?: number;
}

const statusBadge: Record<AttendanceStatus, string> = {
  presente: "success",
  falta: "danger",
  nao_registrada: "warning",
};

const statusOptions: AttendanceStatus[] = [
  "presente",
  "falta",
  "nao_registrada",
];

export function SubjectAbsencePanel({
  subjectCode,
  absences,
  maxAbsences,
  daysRemaining,
  records,
  expandList = false,
  panelHeight,
}: SubjectAbsencePanelProps) {
  const { updateAttendanceStatus, isSaving, saveError } =
    useSubjectAttendance(subjectCode);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>("presente");

  const ratio = maxAbsences > 0 ? (absences / maxAbsences) * 100 : 0;
  const zone =
    ratio >= 80 ? "danger" : ratio >= 50 ? "warning" : "success";
  const label =
    ratio >= 80 ? "Crítico" : ratio >= 50 ? "Atenção" : "Seguro";

  const openEdit = (record: AttendanceRecord) => {
    setEditRecord(record);
    setEditStatus(record.status);
  };

  const closeEdit = () => setEditRecord(null);

  const handleSave = async () => {
    if (!editRecord) return;
    try {
      await updateAttendanceStatus(editRecord.id, editStatus);
      closeEdit();
    } catch {
      // saveError surfaced via hook
    }
  };

  return (
    <>
      <div
        className={`card absence-panel ${expandList ? "absence-panel--expand" : ""}`}
        style={
          expandList && panelHeight
            ? { height: panelHeight, boxSizing: "border-box" }
            : undefined
        }
      >
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
            className="progress-bar-fill"
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
                <tr
                  key={record.id}
                  className="data-table-row-clickable"
                  onClick={() => openEdit(record)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openEdit(record);
                    }
                  }}
                >
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

      <Modal
        open={editRecord !== null}
        onClose={closeEdit}
        title={`Frequência — ${editRecord?.date ?? ""}`}
      >
        <div className="modal-form-stack">
          <fieldset className="status-picker">
            <legend className="form-label">Status</legend>
            <div className="status-picker-options">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`status-picker-btn ${editStatus === status ? "active" : ""} ${statusBadge[status]}`}
                  onClick={() => setEditStatus(status)}
                >
                  {attendanceStatusLabels[status]}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="modal-form-actions">
          {saveError && (
            <p className="form-error" role="alert">
              {saveError}
            </p>
          )}
          <button
            type="button"
            className="btn-gold"
            onClick={() => void handleSave()}
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
          <button type="button" className="btn-outline" onClick={closeEdit}>
            Cancelar
          </button>
        </div>
      </Modal>
    </>
  );
}
