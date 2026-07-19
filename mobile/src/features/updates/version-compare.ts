/** Compara versões `major.minor.patch` (só dígitos). Retorna -1 / 0 / 1. */
export function compareSemver(left: string, right: string): number {
  const a = parseParts(left);
  const b = parseParts(right);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av < bv) return -1;
    if (av > bv) return 1;
  }
  return 0;
}

export function isRemoteNewer(localVersion: string, remoteVersion: string): boolean {
  return compareSemver(localVersion.trim(), remoteVersion.trim()) < 0;
}

function parseParts(raw: string): number[] {
  const cleaned = raw.trim().replace(/^v/i, "");
  if (!cleaned) return [0];
  return cleaned.split(".").map((part) => {
    const n = Number.parseInt(part.replace(/[^\d].*$/, ""), 10);
    return Number.isFinite(n) ? n : 0;
  });
}
