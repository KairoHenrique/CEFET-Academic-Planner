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

/** Metas de CH do PPC — Engenharia de Computação (fase 1). */
export const ENG_COMPUTACAO_CH_CATALOG: readonly ChCatalogEntry[] = [
  { tipoCh: "Obrigatória", totalRequired: 3080, color: "blue" },
  { tipoCh: "Optativa", totalRequired: 240, color: "gold" },
  { tipoCh: "Complementar", totalRequired: 375, color: "success" },
  { tipoCh: "Extensão", totalRequired: 450, color: "warning" },
  { tipoCh: "Flexibilizada", totalRequired: 30, color: "blue" },
] as const;

export const CH_TYPES: readonly ChType[] = ENG_COMPUTACAO_CH_CATALOG.map(
  (entry) => entry.tipoCh
);

export function isChType(value: string): value is ChType {
  return CH_TYPES.includes(value as ChType);
}

export function getChCatalog(): readonly ChCatalogEntry[] {
  return ENG_COMPUTACAO_CH_CATALOG;
}

export function getIntegrationTotalHours(): number {
  return INTEGRATION_TOTAL_HOURS;
}
