import type { CalendarioAcademicoRow } from "@/lib/types/db";
import { resolveEventLabelOverride } from "@/lib/calendar/event-label-overrides";

/** DD/MM/YY — ex.: 22/01/26 */
export function formatIsoToBrDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year.slice(-2)}`;
}

/** Intervalo institucional: 22/01/26 – 25/01/26 */
export function formatAcademicDateRange(
  dataInicio: string,
  dataFim: string | null | undefined
): string {
  const end = dataFim ?? dataInicio;
  if (end === dataInicio) {
    return formatIsoToBrDate(dataInicio);
  }

  return `${formatIsoToBrDate(dataInicio)} – ${formatIsoToBrDate(end)}`;
}

export function formatInstitutionalEventLabel(row: CalendarioAcademicoRow): string {
  const base = row.evento.trim();

  const override = resolveEventLabelOverride(base);
  if (override) return override;

  if (/per[ií]odo letivo/i.test(base) && row.semestre?.trim()) {
    return `${base} ${row.semestre.trim()}`;
  }
  return base;
}

export const ACADEMIC_MILESTONE_INICIO = "Início";
export const ACADEMIC_MILESTONE_FIM = "Fim";
