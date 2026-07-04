"use client";

import { SubjectApelido } from "@/components/simulador/SubjectApelido";
import {
  formatTurmaHorarioLegivel,
  formatTurmaShortLabel,
} from "@/lib/simulador/turma-course-utils";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

interface EnrollmentScheduleExportCardProps {
  course: TurmaOfertadaCourse;
}

export function EnrollmentScheduleExportCard({
  course,
}: EnrollmentScheduleExportCardProps) {
  const shortLabel = formatTurmaShortLabel(course);
  const horarios =
    formatTurmaHorarioLegivel(course)
      ?.split(", ")
      .map((item) => item.trim())
      .filter(Boolean) ?? [];

  return (
    <article className="enrollment-schedule-export-card">
      <span
        className="enrollment-course-accent"
        aria-hidden="true"
        style={{ backgroundColor: course.color }}
      />
      <div className="enrollment-schedule-export-card-body">
        <div className="enrollment-schedule-export-card-head">
          <SubjectApelido
            label={shortLabel}
            className="enrollment-schedule-export-code"
          />
          <p className="enrollment-schedule-export-title" title={course.name}>
            {course.name}
          </p>
        </div>
        {horarios.length > 0 ? (
          <p className="enrollment-schedule-export-times">{horarios.join(", ")}</p>
        ) : null}
      </div>
    </article>
  );
}
