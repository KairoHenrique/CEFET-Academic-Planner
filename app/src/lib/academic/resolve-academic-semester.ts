import type { CalendarioAcademicoRow } from "@/lib/types/db";

const PERIODO_LETIVO_PATTERN = /per[ií]odo letivo/i;

/**
 * Semestre letivo CEFET (padrão): .1 ≈ fev–jul · .2 ≈ ago–dez.
 * Usado pelo robô B66 para escolher qual calendário buscar no SIGAA.
 */
export function resolveAcademicSemesterLabel(referenceDate = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth() + 1;

  if (month >= 8) return `${year}.2`;
  return `${year}.1`;
}

export function compareSemesterLabels(a: string, b: string): number {
  const parse = (value: string) => {
    const match = value.match(/^(\d{4})\.([12])$/);
    if (!match) return { year: 0, period: 0, raw: value };
    return { year: Number(match[1]), period: Number(match[2]), raw: value };
  };

  const left = parse(a);
  const right = parse(b);
  if (left.year !== right.year) return left.year - right.year;
  if (left.period !== right.period) return left.period - right.period;
  return left.raw.localeCompare(right.raw, "pt-BR");
}

export function incrementSemesterLabel(semestre: string): string {
  const match = semestre.match(/^(\d{4})\.([12])$/);
  if (!match) return semestre;

  const year = Number(match[1]);
  const period = Number(match[2]);
  if (period === 1) return `${year}.2`;
  return `${year + 1}.1`;
}

export function resolveNextAcademicSemesterLabel(referenceDate = new Date()): string {
  return incrementSemesterLabel(resolveAcademicSemesterLabel(referenceDate));
}

function formatReferenceDateIso(referenceDate: Date): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, "0");
  const day = String(referenceDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayBeforeIso(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return formatReferenceDateIso(date);
}

export function extractSemesterPeriodStarts(
  rows: CalendarioAcademicoRow[]
): Map<string, string> {
  const starts = new Map<string, string>();

  for (const row of rows) {
    const semestre = row.semestre?.trim();
    if (!semestre || !PERIODO_LETIVO_PATTERN.test(row.evento)) continue;

    const existing = starts.get(semestre);
    if (!existing || row.data_inicio < existing) {
      starts.set(semestre, row.data_inicio);
    }
  }

  return starts;
}

/** Semestre corrente: último cujo início letivo (menos 1 dia) já passou. */
export function resolveCurrentSemesterFromPeriodStarts(
  periodStarts: Map<string, string>,
  referenceDate = new Date()
): string | null {
  const referenceIso = formatReferenceDateIso(referenceDate);
  let current: string | null = null;

  for (const [semestre, startIso] of periodStarts) {
    const swapIso = dayBeforeIso(startIso);
    if (referenceIso < swapIso) continue;
    if (!current || compareSemesterLabels(semestre, current) > 0) {
      current = semestre;
    }
  }

  return current;
}

/** Par exibido no card: semestre corrente (esquerda) + próximo (direita). */
export function resolveAcademicSemesterDisplayPair(
  referenceDate = new Date(),
  rows: CalendarioAcademicoRow[] = []
): [string, string] {
  const periodStarts = extractSemesterPeriodStarts(rows);
  const currentFromCalendar = resolveCurrentSemesterFromPeriodStarts(
    periodStarts,
    referenceDate
  );
  const current = currentFromCalendar ?? resolveAcademicSemesterLabel(referenceDate);
  const next = incrementSemesterLabel(current);
  return [current, next];
}

/** Semestres a tentar no scrape (primário + transição de fim/início de semestre). */
export function resolveCalendarioSemesterTargets(
  referenceDate = new Date()
): string[] {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth() + 1;
  const primary = resolveAcademicSemesterLabel(referenceDate);
  const targets = new Set<string>([primary]);

  if (month >= 6 && month <= 8) {
    targets.add(`${year}.2`);
  }

  if (month === 12) {
    targets.add(`${year + 1}.1`);
  }

  if (month === 1) {
    targets.add(`${year}.1`);
  }

  return [...targets];
}

/** Janela em que o SIGAA costuma publicar calendário para o semestre. */
export function isCalendarioPublicationLikely(
  semestre: string,
  referenceDate = new Date()
): boolean {
  const match = semestre.match(/^(\d{4})\.([12])$/);
  if (!match) return true;

  const year = Number(match[1]);
  const period = Number(match[2]);
  const month = referenceDate.getMonth() + 1;
  const refYear = referenceDate.getFullYear();

  if (period === 1) {
    return refYear === year && month >= 1 && month <= 8;
  }

  return (
    (refYear === year && month >= 6) ||
    (refYear === year + 1 && month <= 2)
  );
}
