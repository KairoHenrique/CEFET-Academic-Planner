import { formatTurmaHorarioLegivel } from "@/lib/simulador/turma-course-utils";
import type {
  SimuladorSimulationExport,
  SimuladorSimulationExportCourse,
  SimuladorSimulationPayload,
} from "@/lib/types/simulador-api";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

export function buildSimulationExport(input: {
  titulo: string;
  semestre: string;
  courses: TurmaOfertadaCourse[];
  generatedAt?: string;
}): SimuladorSimulationExport {
  const exportCourses: SimuladorSimulationExportCourse[] = input.courses.map(
    (course) => {
      const horarioText = formatTurmaHorarioLegivel(course);
      const horarios = horarioText
        ? horarioText.split(",").map((item) => item.trim()).filter(Boolean)
        : [];

      return {
        turmaSigaaId: course.turmaSigaaId,
        code: course.code,
        name: course.name,
        turmaCodigo: course.turmaCodigo,
        horarios,
        professor: course.professor,
        room: course.room,
        ch: course.ch,
      };
    }
  );

  const totalCh = exportCourses.reduce((sum, course) => sum + course.ch, 0);

  return {
    semestre: input.semestre,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    titulo: input.titulo,
    courses: exportCourses,
    totalCh,
  };
}

export function buildSimulationPayload(input: {
  semestre: string;
  turmaSigaaIds: string[];
}): SimuladorSimulationPayload {
  const unique = [...new Set(input.turmaSigaaIds.map((id) => id.trim()).filter(Boolean))];
  return {
    semestre: input.semestre,
    turmaSigaaIds: unique,
  };
}
