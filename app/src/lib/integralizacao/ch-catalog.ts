import type { AppCursoId } from "@/lib/auth/account/types";
import { DEFAULT_CURSO_ID } from "@/lib/db/backend/config";
import type { IntegrationCategory } from "@/lib/types/integration";

export type ChType =
  | "Obrigatória"
  | "Optativa"
  | "Complementar"
  | "Extensão"
  | "Flexibilizada";

export interface ChCatalogEntry {
  tipoCh: ChType;
  totalRequired: number;
  color: IntegrationCategory["color"];
}

/** Metas de CH do PPC — Engenharia de Computação (alinhado ao histórico SIGAA). */
export const ENG_COMPUTACAO_CH_CATALOG: readonly ChCatalogEntry[] = [
  { tipoCh: "Obrigatória", totalRequired: 3105, color: "blue" },
  { tipoCh: "Optativa", totalRequired: 360, color: "gold" },
  { tipoCh: "Complementar", totalRequired: 375, color: "success" },
  { tipoCh: "Extensão", totalRequired: 450, color: "warning" },
  { tipoCh: "Flexibilizada", totalRequired: 30, color: "blue" },
] as const;

/**
 * Metas de CH — Engenharia Mecatrônica (Quadro 13 do PPC).
 * Obrigatória = disciplinas 2675 + PFC I/II 25 + estágio atividade 12,5 + estágio curricular 160.
 */
export const ENG_MECATRONICA_CH_CATALOG: readonly ChCatalogEntry[] = [
  { tipoCh: "Obrigatória", totalRequired: 2873, color: "blue" },
  { tipoCh: "Optativa", totalRequired: 250, color: "gold" },
  { tipoCh: "Complementar", totalRequired: 125, color: "success" },
  { tipoCh: "Extensão", totalRequired: 360, color: "warning" },
  { tipoCh: "Flexibilizada", totalRequired: 0, color: "blue" },
] as const;

/**
 * Metas de CH — Design de Moda (Quadro 78: composição plena).
 * Obrigatória = disciplinas 1725 + estágio supervisionado 125 + TCC/atividades 37,5.
 */
export const DESIGN_MODA_CH_CATALOG: readonly ChCatalogEntry[] = [
  { tipoCh: "Obrigatória", totalRequired: 1888, color: "blue" },
  { tipoCh: "Optativa", totalRequired: 250, color: "gold" },
  { tipoCh: "Complementar", totalRequired: 125, color: "success" },
  { tipoCh: "Extensão", totalRequired: 262, color: "warning" },
  { tipoCh: "Flexibilizada", totalRequired: 75, color: "blue" },
] as const;

export const CH_TYPES: readonly ChType[] = ENG_COMPUTACAO_CH_CATALOG.map(
  (entry) => entry.tipoCh
);

/** Categorias que aceitam lançamento manual pelo aluno (ACC, extensão, etc.). */
export const MANUAL_CH_TYPES: readonly ChType[] = [
  "Complementar",
  "Extensão",
  "Flexibilizada",
] as const;

export function isManualChType(value: ChType): boolean {
  return MANUAL_CH_TYPES.includes(value);
}

export function isChType(value: string): value is ChType {
  return CH_TYPES.includes(value as ChType);
}

export function getChCatalogForCurso(
  cursoId: AppCursoId | string = DEFAULT_CURSO_ID
): readonly ChCatalogEntry[] {
  switch (cursoId) {
    case "eng-mecatronica":
      return ENG_MECATRONICA_CH_CATALOG;
    case "design-moda":
      return DESIGN_MODA_CH_CATALOG;
    case "eng-computacao":
    default:
      return ENG_COMPUTACAO_CH_CATALOG;
  }
}

/** Catálogo padrão (client-safe — Eng. Comp.). No servidor Postgres use `getChCatalogForCurso(resolveQueryCursoId())`. */
export function getChCatalog(): readonly ChCatalogEntry[] {
  return getChCatalogForCurso(DEFAULT_CURSO_ID);
}

export function getIntegrationTotalHours(
  cursoId: AppCursoId | string = DEFAULT_CURSO_ID
): number {
  return getChCatalogForCurso(cursoId).reduce(
    (sum, entry) => sum + entry.totalRequired,
    0
  );
}
