import {
  formatInstitutionalEventLabel,
  formatIsoToBrDate,
} from "@/lib/calendar/academic-date-format";
import { mergeKnownInstitutionalDates } from "@/lib/calendar/known-institutional-dates";
import {
  buildAcademicDateAlertFingerprint,
  buildAcademicDateStableKey,
  type AcademicDateAlertSlot,
} from "@/lib/notifications/notification-fingerprint";
import type { CalendarioAcademicoRow } from "@/lib/types/db";
import type { NotificationSnapshotItem } from "@/lib/types/notifications-api";

/**
 * B37 — datas acadêmicas institucionais.
 *
 * Avisa só em 3 momentos (não a cada dia da janela):
 * - `new`: data nova no calendário (primeira aparição no snapshot)
 * - `1d`: um dia antes
 * - `0d`: no dia do evento
 */
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

function buildSlotSubtitle(
  slot: AcademicDateAlertSlot,
  startIso: string
): string {
  const dateLabel = formatIsoToBrDate(startIso);
  if (slot === "new") return `Nova data · ${dateLabel}`;
  if (slot === "1d") return `Amanhã · ${dateLabel}`;
  return `Hoje · ${dateLabel}`;
}

function buildSlotTitle(
  slot: AcademicDateAlertSlot,
  eventLabel: string
): string {
  if (slot === "new") return `Nova data: ${eventLabel}`;
  if (slot === "1d") return `Amanhã: ${eventLabel}`;
  return `Hoje: ${eventLabel}`;
}

/** Núcleo puro — recebe as linhas do calendário acadêmico (SQLite ou Postgres). */
export function buildAcademicDateAlertItems(
  academicRows: CalendarioAcademicoRow[],
  referenceDate: Date = new Date()
): NotificationSnapshotItem[] {
  const rows = mergeKnownInstitutionalDates(academicRows);
  const todayIso = toIsoDate(referenceDate);
  const items: NotificationSnapshotItem[] = [];

  for (const row of rows) {
    const startIso = row.data_inicio?.trim();
    if (!startIso || !ISO_DATE.test(startIso)) continue;
    if (startIso < todayIso) continue;

    const eventLabel = formatInstitutionalEventLabel(row);
    const days = daysBetweenIso(todayIso, startIso);
    const slots: AcademicDateAlertSlot[] = ["new"];
    if (days === 1) slots.push("1d");
    if (days === 0) slots.push("0d");

    for (const slot of slots) {
      items.push({
        fingerprint: buildAcademicDateAlertFingerprint(
          buildAcademicDateStableKey(row.evento, startIso, row.semestre),
          slot
        ),
        kind: "calendar-date-alert",
        title: buildSlotTitle(slot, eventLabel),
        subtitle: buildSlotSubtitle(slot, startIso),
        href: "/calendario",
        at: startIso,
      });
    }
  }

  items.sort((a, b) => {
    const byDate = (a.at ?? "").localeCompare(b.at ?? "");
    if (byDate !== 0) return byDate;
    return a.fingerprint.localeCompare(b.fingerprint);
  });
  return items;
}
