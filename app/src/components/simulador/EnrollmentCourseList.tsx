"use client";

import { useMemo } from "react";
import { EnrollmentCourseGroupCard } from "@/components/simulador/EnrollmentCourseGroupCard";
import { groupEnrollmentCourses } from "@/lib/simulador/group-enrollment-courses";
import type { ScheduleSlot } from "@/lib/types/schedule";
import { type CorequisitoObligation } from "@/lib/simulador/corequisito-cluster-viability";
import type { SimuladorPlacementContext } from "@/lib/simulador/corequisito-schedule-policy";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

interface EnrollmentCourseListProps {
  title: string;
  courses: TurmaOfertadaCourse[];
  catalog: TurmaOfertadaCourse[];
  schedule: ScheduleSlot[][];
  placementContext: SimuladorPlacementContext;
  corequisitoObligation: CorequisitoObligation | null;
  selectedTurmaId: string | null;
  onSelect: (course: TurmaOfertadaCourse) => void;
}

export function EnrollmentCourseList({
  title,
  courses,
  catalog,
  schedule,
  placementContext,
  corequisitoObligation,
  selectedTurmaId,
  onSelect,
}: EnrollmentCourseListProps) {
  const groups = useMemo(() => groupEnrollmentCourses(courses), [courses]);

  return (
    <section className="enrollment-section" aria-label={title}>
      <div className="enrollment-section-head">
        <h4 className="enrollment-subtitle">{title}</h4>
        <span className="enrollment-section-count">{courses.length}</span>
      </div>
      {groups.length === 0 ? (
        <p className="enrollment-section-empty" role="status">
          Nenhuma turma disponível
        </p>
      ) : (
        <ul className="enrollment-course-list">
          {groups.map((group) => (
            <EnrollmentCourseGroupCard
              key={group.id}
              group={group}
              catalog={catalog}
              schedule={schedule}
              placementContext={placementContext}
              corequisitoObligation={corequisitoObligation}
              selectedTurmaId={selectedTurmaId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
