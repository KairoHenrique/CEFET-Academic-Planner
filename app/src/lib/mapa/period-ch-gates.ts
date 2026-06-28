import type { ChType } from "@/lib/integralizacao/ch-catalog";
import type { DisciplinaRow } from "@/lib/types/db";

/** Atividades finais que exigem progresso real de CH obrigatória (PPC / SIGAA). */
const CH_GATED_CAPSTONE_CODES = new Set([
  "04/8",
  "PFC2",
  "ESTAGIO",
]);

/** ~75% da meta de CH obrigatória antes de PFC / estágio. */
export const CAPSTONE_MIN_OBRIGATORIA_RATIO = 0.75;

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Humanidades e componentes sem pré-requisito no PPC (Sociologia, Psicologia,
 * Gestão, Empreendedorismo…) podem ser cursados antes do “período” nominal —
 * não usam trava por CH acumulada, só pré-requisito quando existir.
 */
export function isChGatedCapstone(disciplina: DisciplinaRow): boolean {
  const code = normalizeCode(disciplina.codigo);
  if (CH_GATED_CAPSTONE_CODES.has(code)) return true;

  const name = disciplina.nome.toLowerCase();
  return (
    name.includes("atividade de pfc") ||
    name.includes("estágio supervisionado") ||
    name.includes("estagio supervisionado")
  );
}

export function computeCapstoneMinimum(obrigatoriaTotal: number): number {
  return Math.ceil(obrigatoriaTotal * CAPSTONE_MIN_OBRIGATORIA_RATIO);
}

export interface ChGateEvaluation {
  allowed: boolean;
  chRemaining: number;
}

export function evaluateChGateForDisciplina(
  disciplina: DisciplinaRow,
  obrigatoriaDone: number,
  obrigatoriaTotal: number
): ChGateEvaluation {
  if (!isChGatedCapstone(disciplina)) {
    return { allowed: true, chRemaining: 0 };
  }

  const minimum = computeCapstoneMinimum(obrigatoriaTotal);
  const chRemaining = Math.max(0, minimum - obrigatoriaDone);
  return { allowed: chRemaining === 0, chRemaining };
}

export function getObrigatoriaTotalFromCatalog(
  catalog: readonly { tipoCh: ChType; totalRequired: number }[]
): number {
  return catalog.find((entry) => entry.tipoCh === "Obrigatória")?.totalRequired ?? 0;
}
