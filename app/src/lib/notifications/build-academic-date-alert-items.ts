import {
  formatInstitutionalEventLabel,
  formatIsoToBrDate,
} from "@/lib/calendar/academic-date-format";
import { mergeKnownInstitutionalDates } from "@/lib/calendar/known-institutional-dates";
import { buildAcademicDateAlertFingerprint } from "@/lib/notifications/notification-fingerprint";
import type { CalendarioAcademicoRow } from "@/lib/types/db";
import type { NotificationSnapshotItem } from "@/lib/types/notifications-api";

/**
 * B37 — datas acadêmicas institucionais próximas (matrícula, rematrícula,
 * resultados, provas finais, período letivo…).
 *
 * Complementa o pipeline de lembretes 24h/1h do sino, que hoje EXCLUI eventos
 * `academico-*`. Aqui a janela é diária (`[hoje, hoje+N]`): a cada refetch do
 * React Query o conjunto reflete a data atual, sem precisar do tick de 60s.
 */
const UPCOMING_WINDOW_DAYS = 14;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

function toIsoDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function daysBetweenIso(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T12:00:00`).getTime();
  const to = new Date(`${toIso}T12:00:00`).getTime();
  return Math.round((to - from) / MS_PER_DAY);
}

function buildCountdownSubtitle(startIso: string, todayIso: string): string {
  const days = daysBetweenIso(todayIso, startIso);
  const dateLabel = formatIsoToBrDate(startIso);
  if (days <= 0) return `Hoje · ${dateLabel}`;
  if (days === 1) return `Amanhã · ${dateLabel}`;
  return `Em ${days} dias · ${dateLabel}`;
}

/** Núcleo puro — recebe as linhas do calendário acadêmico (SQLite ou Postgres). */
export function buildAcademicDateAlertItems(
  academicRows: CalendarioAcademicoRow[],
  referenceDate: Date = new Date(),
  windowDays: number = UPCOMING_WINDOW_DAYS
): NotificationSnapshotItem[] {
  const rows = mergeKnownInstitutionalDates(academicRows);

  const todayIso = toIsoDate(referenceDate);
  const horizon = new Date(referenceDate);
  horizon.setDate(horizon.getDate() + windowDays);
  const horizonIso = toIsoDate(horizon);

  const items: NotificationSnapshotItem[] = [];
  for (const row of rows) {
    const startIso = row.data_inicio?.trim();
    if (!startIso || !ISO_DATE.test(startIso)) continue;
    if (startIso < todayIso || startIso > horizonIso) continue;

    items.push({
      fingerprint: buildAcademicDateAlertFingerprint(String(row.id), startIso),
      kind: "calendar-date-alert",
      title: formatInstitutionalEventLabel(row),
      subtitle: buildCountdownSubtitle(startIso, todayIso),
      href: "/calendario",
      at: startIso,
    });
  }

  items.sort((a, b) => (a.at ?? "").localeCompare(b.at ?? ""));
  return items;
}
