"use client";

import { computeAbsenceRisk } from "@/lib/disciplinas/absence-risk";
import {
  GradeRiskBar,
  GradeRiskIndicator,
} from "@/components/grades/GradeRiskIndicator";
import { SUBJECT_DISPLAY_GRADE_MAX } from "@/lib/disciplinas/grade-display";
import { PrioritySelect } from "@/components/ui/PrioritySelect";
import { Icon } from "@/components/ui/Icon";
import { useSubjectPriorities } from "@/hooks/useStoredPriorities";
import { useSubjectRecovery } from "@/hooks/useSubjectRecovery";
import type { SubjectSummary } from "@/lib/types/subject";
import Link from "next/link";

export function SubjectCard({ subject }: { subject: SubjectSummary }) {
  const { getPriority, setSubjectPriority } = useSubjectPriorities();
  const { gradeRisk, recoveryScore, setRecoveryScore } = useSubjectRecovery(
    subject.code,
    subject.gradeRisk
  );
  const absenceRisk = computeAbsenceRisk(subject.absences, subject.maxAbsences);
  const href = `/disciplinas/${encodeURIComponent(subject.code)}`;
  const priority = getPriority(subject.code);
  const hasGrade = gradeRisk.zone !== "unknown";

  return (
    <div
      className="subject-card"
      style={{ borderLeft: `2px solid ${subject.color}` }}
    >
      <div className="subject-card-header">
        <h3 className="subject-name">{subject.name}</h3>
        <PrioritySelect
          className="subject-card-priority"
          level={priority}
          compact
          onChange={(level) => setSubjectPriority(subject.code, level)}
        />
      </div>

      <div className="subject-card-body">
        <div className="subject-stats-grid">
          <GradeRiskIndicator
            grade={subject.grade}
            gradeRisk={gradeRisk}
            variant="card"
            showBar={false}
            showHint={false}
            recoveryInteractive
            recoveryScore={recoveryScore}
            onRecoveryScoreSave={setRecoveryScore}
            onRecoveryScoreClear={() => setRecoveryScore(null)}
          />

          <Link
            href={href}
            className="subject-card-nav-block"
            aria-label={`Abrir disciplina ${subject.name}`}
          >
            <div className="subject-stat-block subject-stat-stack">
              <span className="subject-stat-label">Faltas</span>
              <div className="subject-stat-value">
                {subject.absences}
                <span className="subject-stat-max"> / {subject.maxAbsences}</span>
              </div>
              <span className={`badge subject-stat-badge ${absenceRisk.badgeClass}`}>
                {absenceRisk.label}
              </span>
            </div>
          </Link>
        </div>

        <Link
          href={href}
          className="subject-card-nav-block"
          aria-label={`Abrir disciplina ${subject.name}`}
        >
          <div className="subject-card-bars">
            {hasGrade && (
              <GradeRiskBar
                gradeRisk={gradeRisk}
                scaleMax={SUBJECT_DISPLAY_GRADE_MAX}
              />
            )}
            <div
              className="progress-bar progress-bar--absence"
              role="progressbar"
              aria-valuenow={Math.round(absenceRisk.ratio)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Faltas: ${subject.absences} de ${subject.maxAbsences}`}
            >
              <div
                className={`progress-bar-fill progress-bar-fill--absence progress-bar-fill--absence-${absenceRisk.zone}`}
                style={{ width: `${absenceRisk.ratio}%` }}
              />
            </div>
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
        </Link>
      </div>
    </div>
  );
}
