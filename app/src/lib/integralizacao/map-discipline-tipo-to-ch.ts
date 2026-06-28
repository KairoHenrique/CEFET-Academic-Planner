import type { ChType } from "@/lib/integralizacao/ch-catalog";

/** Mapeia `disciplinas.tipo` (PPC) para categoria de integralização. */
export function mapDisciplineTipoToChType(tipo: string | null | undefined): ChType {
  const normalized = tipo?.trim().toLowerCase() ?? "";

  if (normalized.includes("optativ") || normalized.includes("eletiv")) {
    return "Optativa";
  }
  if (normalized.includes("complement")) {
    return "Complementar";
  }
  if (normalized.includes("extens")) {
    return "Extensão";
  }
  if (normalized.includes("flexibil")) {
    return "Flexibilizada";
  }

  return "Obrigatória";
}
