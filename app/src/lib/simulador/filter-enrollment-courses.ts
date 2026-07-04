import { formatTurmaShortLabel } from "@/lib/simulador/turma-course-utils";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

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
