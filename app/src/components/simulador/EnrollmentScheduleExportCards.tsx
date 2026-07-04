"use client";

import { useMemo } from "react";
import { EnrollmentScheduleExportCard } from "@/components/simulador/EnrollmentScheduleExportCard";
import { resolvePlacedTurmasFromSchedule } from "@/lib/simulador/enrollment-schedule-stats";
import type { ScheduleSlot } from "@/lib/types/schedule";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

interface EnrollmentScheduleExportCardsProps {
  schedule: ScheduleSlot[][];
  catalog: TurmaOfertadaCourse[];
}

export function EnrollmentScheduleExportCards({
  schedule,
  catalog,
}: EnrollmentScheduleExportCardsProps) {
  const placedCourses = useMemo(
    () => resolvePlacedTurmasFromSchedule(schedule, catalog),
    [schedule, catalog]
  );

  if (placedCourses.length === 0) return null;

  return (
    <section
      className="enrollment-schedule-export-cards"
      aria-label="Disciplinas selecionadas na grade simulada"
    >
      <h5 className="enrollment-schedule-export-cards-title">
        Disciplinas selecionadas
      </h5>
      <div className="enrollment-schedule-export-cards-grid">
        {placedCourses.map((course) => (
          <EnrollmentScheduleExportCard
            key={course.turmaSigaaId}
            course={course}
          />
        ))}
      </div>
    </section>
  );
}
