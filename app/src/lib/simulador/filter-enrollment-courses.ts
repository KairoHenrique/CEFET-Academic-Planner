import { formatTurmaShortLabel } from "@/lib/simulador/turma-course-utils";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

export type EnrollmentEligibilityFilter =
  | "todas"
  | "elegiveis"
  | "condicionais"
  | "bloqueadas";

export const ENROLLMENT_ELIGIBILITY_FILTER_LABELS: Record<
  EnrollmentEligibilityFilter,
  string
> = {
  todas: "Todas",
  elegiveis: "Elegíveis",
  condicionais: "Condicionais",
  bloqueadas: "Bloqueadas",
};

export const ENROLLMENT_ELIGIBILITY_FILTER_ORDER: EnrollmentEligibilityFilter[] =
  ["todas", "elegiveis", "condicionais", "bloqueadas"];

export function filterEnrollmentCoursesByQuery(
  courses: TurmaOfertadaCourse[],
  query: string
): TurmaOfertadaCourse[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return courses;

  return courses.filter((course) => {
    const shortLabel = formatTurmaShortLabel(course).toLowerCase();
    return (
      course.name.toLowerCase().includes(normalized) ||
      course.code.toLowerCase().includes(normalized) ||
      shortLabel.includes(normalized)
    );
  });
}

export function filterEnrollmentCoursesByEligibility(
  courses: TurmaOfertadaCourse[],
  filter: EnrollmentEligibilityFilter
): TurmaOfertadaCourse[] {
  if (filter === "todas") return courses;

  if (filter === "elegiveis") {
    return courses.filter((course) => course.status === "unlocked");
  }

  if (filter === "condicionais") {
    return courses.filter((course) => course.status === "conditional");
  }

  return courses.filter(
    (course) => course.status === "locked" || Boolean(course.scheduleBlocker)
  );
}
