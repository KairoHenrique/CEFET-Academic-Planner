import { academicDates } from "@/config/mock/calendar";
import { resolveCalendarioSemesterTargets } from "@/lib/academic/resolve-academic-semester";
import type { CalendarioAcademicoSnapshot } from "@/lib/scraper/types/calendario";

function parseMockDateRange(date: string, year: string): {
  dataInicio: string;
  dataFim: string | null;
} {
  if (date.includes("–") || date.includes("-")) {
    const separator = date.includes("–") ? "–" : "-";
    const [startRaw, endRaw] = date.split(separator).map((part) => part.trim());
    const yearMatch = endRaw.match(/\d{4}/);
    const resolvedYear = yearMatch?.[0] ?? year;
    const startParts = startRaw.split("/");
    const endParts = endRaw.replace(/\s*\d{4}/, "").trim().split("/");
    const pad = (value: string) => value.padStart(2, "0");
    return {
      dataInicio: `${resolvedYear}-${pad(startParts[1])}-${pad(startParts[0])}`,
      dataFim: `${resolvedYear}-${pad(endParts[1])}-${pad(endParts[0])}`,
    };
  }

  const [day, month, maybeYear] = date.split("/");
  const resolvedYear = maybeYear?.length === 4 ? maybeYear : year;
  return {
    dataInicio: `${resolvedYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
    dataFim: null,
  };
}

export function buildMockCalendarioSnapshot(
  referenceDate = new Date()
): CalendarioAcademicoSnapshot {
  const semestreAlvo = resolveCalendarioSemesterTargets(referenceDate);
  const primaryYear = semestreAlvo[0]?.split(".")[0] ?? String(referenceDate.getFullYear());

  const eventos = academicDates.map((item) => {
    const parsed = parseMockDateRange(item.date, primaryYear);
    return {
      evento: item.label,
      dataInicio: parsed.dataInicio,
      dataFim: parsed.dataFim,
      semestre: semestreAlvo[0] ?? null,
    };
  });

  return {
    scrapedAt: referenceDate.toISOString(),
    semestreAlvo,
    eventos,
  };
}
