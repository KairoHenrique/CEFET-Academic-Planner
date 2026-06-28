/** Distribui salas quando `local` traz múltiplos valores (ex.: `303/620`). */
export function resolveSlotRooms(
  local: string | null | undefined,
  slotCount: number
): string[] {
  if (slotCount <= 0) return [];

  const fallback = "—";
  const raw = local?.trim();
  if (!raw) return Array.from({ length: slotCount }, () => fallback);

  const parts = raw
    .split(/[/,]/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return Array.from({ length: slotCount }, () => fallback);
  }

  if (parts.length === 1) {
    return Array.from({ length: slotCount }, () => parts[0]);
  }

  return Array.from({ length: slotCount }, (_, index) => {
    return parts[index] ?? parts[parts.length - 1];
  });
}
