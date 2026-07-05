import type { AppCursoId } from "@/lib/auth/account/types";
import { DEFAULT_CURSO_ID } from "@/lib/db/backend/config";
import type { IntegrationCategory } from "@/lib/types/integration";
import { INTEGRATION_TOTAL_HOURS } from "@/lib/types/integration";

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
    case "eng-computacao":
    case "eng-mecatronica":
    case "design-moda":
      return ENG_COMPUTACAO_CH_CATALOG;
    default:
      return ENG_COMPUTACAO_CH_CATALOG;
  }
}

/** Catálogo padrão (client-safe — Eng. Comp.). No servidor Postgres use `getChCatalogForCurso(resolveQueryCursoId())`. */
export function getChCatalog(): readonly ChCatalogEntry[] {
  return getChCatalogForCurso(DEFAULT_CURSO_ID);
}

export function getIntegrationTotalHours(): number {
  return INTEGRATION_TOTAL_HOURS;
}
