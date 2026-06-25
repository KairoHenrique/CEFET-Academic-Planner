import { Icon } from "@/components/ui/Icon";
import type { SubjectSummary } from "@/lib/types/subject";

function getAbsenceStatus(current: number, max: number) {
  const ratio = current / max;
  if (ratio >= 0.8) return { label: "Crítico", badgeClass: "danger" as const };
  if (ratio >= 0.5) return { label: "Atenção", badgeClass: "warning" as const };
  return { label: "Seguro", badgeClass: "success" as const };
}

export function SubjectCard({ subject }: { subject: SubjectSummary }) {
  const absenceStatus = getAbsenceStatus(subject.absences, subject.maxAbsences);
  const absenceRatio = (subject.absences / subject.maxAbsences) * 100;

  return (
    <div
      className="subject-card"
      style={{ borderLeft: `2px solid ${subject.color}` }}
    >
      <div className="subject-name">{subject.name}</div>

      <div className="subject-stats-grid">
        <div>
          <div className="subject-stat-label">Nota</div>
          <div className="subject-stat-value">
            {subject.grade !== null ? (
              <>
                <span>{subject.grade}</span>
                <span className="subject-stat-max"> / {subject.gradeMax}</span>
              </>
            ) : (
              <span className="subject-stat-max">—</span>
            )}
          </div>
        </div>

        <div>
          <div className="subject-stat-label">Faltas</div>
          <div className="subject-absence-row">
            <span className="subject-stat-value">
              {subject.absences}
              <span className="subject-stat-max"> / {subject.maxAbsences}</span>
            </span>
            <span className={`badge ${absenceStatus.badgeClass}`}>
              {absenceStatus.label}
            </span>
          </div>
        </div>
      </div>

      <div className="progress-bar">
        <div
          className={`progress-bar-fill ${absenceStatus.badgeClass}`}
          style={{ width: `${absenceRatio}%` }}
        />
      </div>

      <div className="subject-meta">
        <span className="subject-meta-item">
          <Icon name="building" size={13} />
          {subject.room}
        </span>
        {subject.tasks > 0 && (
          <span className="subject-meta-item tasks-warning">
            <Icon name="clipboard" size={13} />
            {subject.tasks} tarefa{subject.tasks > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
