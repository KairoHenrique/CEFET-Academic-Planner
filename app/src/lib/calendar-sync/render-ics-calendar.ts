import type { CalendarSyncItem } from "@/lib/calendar-sync/build-calendar-sync-items";

const TIMEZONE_ID = "America/Sao_Paulo";
const MAX_LINE_OCTETS = 75;
const utf8 = new TextEncoder();

/** RFC 5545 §3.3.11 — escapa texto e remove caracteres de controle. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/** RFC 5545 §3.1 — dobra linhas em 75 octetos sem quebrar caracteres UTF-8. */
export function foldIcsLine(line: string): string {
  if (utf8.encode(line).length <= MAX_LINE_OCTETS) return line;

  const parts: string[] = [];
  let current = "";
  let currentOctets = 0;
  for (const char of line) {
    const charOctets = utf8.encode(char).length;
    const limit = parts.length === 0 ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1;
    if (currentOctets + charOctets > limit) {
      parts.push(current);
      current = "";
      currentOctets = 0;
    }
    current += char;
    currentOctets += charOctets;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function compactDate(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

function compactLocalDateTime(isoLocal: string): string {
  const [date, time] = isoLocal.split("T");
  return `${compactDate(date)}T${time.replace(":", "")}00`;
}

function formatUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function formatTrigger(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? "-" : "";
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const body = `${hours > 0 ? `${hours}H` : ""}${minutes > 0 || hours === 0 ? `${minutes}M` : ""}`;
  return `${sign}PT${body}`;
}

function renderDateProperty(name: "DTSTART" | "DTEND", value: string, allDay: boolean): string {
  return allDay
    ? `${name};VALUE=DATE:${compactDate(value)}`
    : `${name};TZID=${TIMEZONE_ID}:${compactLocalDateTime(value)}`;
}

function renderAlarm(offsetMinutes: number, title: string): string[] {
  return [
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(title)}`,
    `TRIGGER:${formatTrigger(offsetMinutes)}`,
    "END:VALARM",
  ];
}

function renderEvent(item: CalendarSyncItem, stamp: string): string[] {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(item.uid)}`,
    `DTSTAMP:${stamp}`,
    renderDateProperty("DTSTART", item.start, item.allDay),
    renderDateProperty("DTEND", item.end, item.allDay),
    `SUMMARY:${escapeIcsText(item.title)}`,
  ];
  if (item.notes) lines.push(`DESCRIPTION:${escapeIcsText(item.notes)}`);
  if (item.location) lines.push(`LOCATION:${escapeIcsText(item.location)}`);
  lines.push(`CATEGORIES:${escapeIcsText(item.category)}`);
  if (item.allDay) lines.push("TRANSP:TRANSPARENT");
  for (const offset of item.alarmOffsetsMinutes) {
    lines.push(...renderAlarm(offset, item.title));
  }
  lines.push("END:VEVENT");
  return lines;
}

/** Brasília está fixa em -03:00 desde 2019 (sem horário de verão). */
const VTIMEZONE_LINES = [
  "BEGIN:VTIMEZONE",
  `TZID:${TIMEZONE_ID}`,
  "BEGIN:STANDARD",
  "DTSTART:19700101T000000",
  "TZOFFSETFROM:-0300",
  "TZOFFSETTO:-0300",
  "TZNAME:-03",
  "END:STANDARD",
  "END:VTIMEZONE",
];

export function renderIcsCalendar(
  items: CalendarSyncItem[],
  options: { calendarName: string; now?: Date }
): string {
  const stamp = formatUtcStamp(options.now ?? new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ACME HUB//Agenda Academica//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(options.calendarName)}`,
    `X-WR-TIMEZONE:${TIMEZONE_ID}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
    ...VTIMEZONE_LINES,
  ];
  for (const item of items) lines.push(...renderEvent(item, stamp));
  lines.push("END:VCALENDAR");
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}
