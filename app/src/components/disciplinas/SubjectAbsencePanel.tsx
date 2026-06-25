import { SectionHeader } from "@/components/ui/SectionHeader";

interface SubjectAbsencePanelProps {
  absences: number;
  maxAbsences: number;
}

export function SubjectAbsencePanel({
  absences,
  maxAbsences,
}: SubjectAbsencePanelProps) {
  const ratio = (absences / maxAbsences) * 100;
  const status =
    ratio >= 80 ? "danger" : ratio >= 50 ? "warning" : "success";
  const label =
    ratio >= 80 ? "Crítico" : ratio >= 50 ? "Atenção" : "Seguro";

  return (
    <div className="card card-full-height">
      <SectionHeader title="Frequência" icon="clipboard" badge={<span className={`badge ${status}`}>{label}</span>} />

      <div className="absence-summary">
        <span className="absence-count">
          {absences}
          <span className="subject-stat-max"> / {maxAbsences}</span>
        </span>
        <p className="absence-detail">faltas registradas neste semestre</p>
      </div>

      <div className="progress-bar progress-bar-lg">
        <div
          className={`progress-bar-fill ${status}`}
          style={{ width: `${ratio}%` }}
        />
      </div>

      <ul className="frequency-list">
        {["12/03", "19/03", "02/04", "16/04"].slice(0, absences).map((date) => (
          <li key={date} className="frequency-item">
            <span>{date}</span>
            <span className="badge danger">Falta</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
