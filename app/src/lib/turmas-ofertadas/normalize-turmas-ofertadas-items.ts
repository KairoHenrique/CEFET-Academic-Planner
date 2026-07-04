import type {
  TurmaOfertadaItem,
  TurmaOfertadaSituacao,
} from "@/lib/scraper/types/turmas-ofertadas";
import { extractHorarioCodigoFromText } from "@/lib/schedule/parse-sigaa-codigo";

function normalizeHorarioKey(codigoHorario: string | null | undefined): string {
  const normalized = codigoHorario?.trim().toUpperCase().replace(/\s+/g, "-");
  return normalized && normalized.length > 0 ? normalized : "sem-horario";
}

/** Chave estável por oferta — inclui horário para não colapsar turmas do mesmo componente. */
export function buildTurmaSigaaId(
  semestre: string,
  sigaaComponente: string,
  situacao: TurmaOfertadaSituacao,
  codigoHorario: string | null | undefined
): string {
  return `${semestre}:${sigaaComponente}:${situacao}:${normalizeHorarioKey(codigoHorario)}`;
}

function normalizeNomeKey(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function resolveHorarioFingerprint(item: TurmaOfertadaItem): string {
  const codigo =
    item.codigoHorario?.trim().toUpperCase() ??
    extractHorarioCodigoFromText(item.horarioExibicao ?? "") ??
    "";
  return codigo.replace(/\s+/g, "-") || "sem-horario";
}

/** Identifica a mesma oferta lógica (mesma disciplina + horário), mesmo com IDs SIGAA distintos. */
export function buildTurmaOfferFingerprint(item: TurmaOfertadaItem): string {
  return [
    item.semestre,
    item.codigoDisciplina.trim().toUpperCase(),
    normalizeNomeKey(item.nome),
    resolveHorarioFingerprint(item),
  ].join("|");
}

function pickRicherTurmaOffer(
  current: TurmaOfertadaItem,
  candidate: TurmaOfertadaItem
): TurmaOfertadaItem {
  if (candidate.situacao === "atendida" && current.situacao !== "atendida") {
    return candidate;
  }
  if (current.situacao === "atendida" && candidate.situacao !== "atendida") {
    return current;
  }

  const currentHasHorario = Boolean(current.codigoHorario?.trim());
  const candidateHasHorario = Boolean(candidate.codigoHorario?.trim());
  if (candidateHasHorario && !currentHasHorario) return candidate;
  if (currentHasHorario && !candidateHasHorario) return current;

  const currentVagas = current.vagas ?? -1;
  const candidateVagas = candidate.vagas ?? -1;
  if (candidateVagas > currentVagas) return candidate;

  return current;
}

/** Remove duplicatas exatas do site; preserva turmas distintas (ex.: mesmo componente, horários diferentes). */
export function dedupeTurmasOfertadasItems(
  items: TurmaOfertadaItem[]
): TurmaOfertadaItem[] {
  const unique = new Map<string, TurmaOfertadaItem>();

  for (const item of items) {
    const fingerprint = buildTurmaOfferFingerprint(item);
    const existing = unique.get(fingerprint);
    unique.set(fingerprint, existing ? pickRicherTurmaOffer(existing, item) : item);
  }

  return Array.from(unique.values());
}

export function buildTurmaOfferFingerprintByCode(
  item: TurmaOfertadaItem,
  resolvedCode: string
): string {
  return [
    item.semestre,
    resolvedCode.trim().toUpperCase(),
    resolveHorarioFingerprint(item),
  ].join("|");
}

export function dedupeTurmasOfertadasItemsByResolvedCode(
  items: TurmaOfertadaItem[],
  resolveCode: (item: TurmaOfertadaItem) => string
): TurmaOfertadaItem[] {
  const unique = new Map<string, TurmaOfertadaItem>();

  for (const item of items) {
    const fingerprint = buildTurmaOfferFingerprintByCode(item, resolveCode(item));
    const existing = unique.get(fingerprint);
    unique.set(fingerprint, existing ? pickRicherTurmaOffer(existing, item) : item);
  }

  return assignTurmaSigaaIds(Array.from(unique.values()));
}

export function assignTurmaSigaaIds(items: TurmaOfertadaItem[]): TurmaOfertadaItem[] {
  return items.map((item) => {
    const sigaaKey = item.sigaaComponente ?? item.codigoDisciplina;
    return {
      ...item,
      turmaSigaaId: buildTurmaSigaaId(
        item.semestre,
        sigaaKey,
        item.situacao,
        item.codigoHorario
      ),
    };
  });
}

export function normalizeTurmasOfertadasItems(
  items: TurmaOfertadaItem[]
): TurmaOfertadaItem[] {
  return assignTurmaSigaaIds(dedupeTurmasOfertadasItems(items));
}
