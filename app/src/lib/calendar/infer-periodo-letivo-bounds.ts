/**
 * Janela aproximada do período letivo CEFET quando o robô de calendário
 * ainda não populou "Período Letivo" e a turma não trouxe datas no portal.
 *
 * .1 → março–julho · .2 → agosto–dezembro (calendário típico do campus).
 */
export function inferDefaultPeriodoLetivoBounds(
  semestre: string | null | undefined
): { dataInicio: string; dataFim: string } | null {
  const match = semestre?.trim().match(/^(\d{4})\.([12])$/);
  if (!match) return null;

  const year = match[1];
  const half = match[2];

  if (half === "1") {
    return { dataInicio: `${year}-03-01`, dataFim: `${year}-07-15` };
  }

  return { dataInicio: `${year}-08-01`, dataFim: `${year}-12-20` };
}

/** Infere `YYYY.S` a partir de hoje (jan–jul → .1, ago–dez → .2). */
export function inferCurrentSemestreLabel(now = new Date()): string {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const half = month <= 7 ? "1" : "2";
  return `${year}.${half}`;
}

/** Escolhe o semestre mais recente entre linhas acadêmicas; senão o corrente. */
export function resolveSemestreForClassBounds(
  academicSemestres: Array<string | null | undefined>,
  now = new Date()
): string {
  const candidates = academicSemestres
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value?.match(/^\d{4}\.[12]$/)))
    .sort();

  return candidates.at(-1) ?? inferCurrentSemestreLabel(now);
}
