/** Verifica se `now` está dentro da janela `"HH:MM-HH:MM"`. */
export function isWithinTimeWindow(
  window: string,
  now: Date,
  timeZone = "America/Sao_Paulo"
): boolean {
  const match = window.trim().match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
  if (!match) return false;

  const [, sh, sm, eh, em] = match;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const current = hour * 60 + minute;
  const start = Number(sh) * 60 + Number(sm);
  const end = Number(eh) * 60 + Number(em);

  if (start <= end) {
    return current >= start && current < end;
  }

  return current >= start || current < end;
}

export function isWithinNightlyWindow(
  window: string,
  now: Date
): boolean {
  return isWithinTimeWindow(window, now);
}
