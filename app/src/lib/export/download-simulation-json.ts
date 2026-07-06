import { buildSimulationExport } from "@/lib/simulador/build-simulation-export";
import { resolvePlacedTurmasFromSchedule } from "@/lib/simulador/enrollment-schedule-stats";
import type { SimuladorSimulationExport } from "@/lib/types/simulador-api";
import type { ScheduleSlot } from "@/lib/types/schedule";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

function sanitizeFilename(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function buildSimulationExportFromSchedule(input: {
  titulo: string;
  semestre: string;
  schedule: ScheduleSlot[][];
  catalog: TurmaOfertadaCourse[];
}): SimuladorSimulationExport {
  const courses = resolvePlacedTurmasFromSchedule(input.schedule, input.catalog);
  return buildSimulationExport({
    titulo: input.titulo,
    semestre: input.semestre,
    courses,
  });
}

export function downloadSimulationJson(
  exportData: SimuladorSimulationExport
): void {
  const slug = sanitizeFilename(exportData.titulo) || "simulacao";
  const filename = `matricula-${slug}-${exportData.semestre.replace(/\./g, "-")}.json`;
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
