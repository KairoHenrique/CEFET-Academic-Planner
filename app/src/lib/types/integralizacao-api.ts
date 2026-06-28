import type { ChType } from "@/lib/integralizacao/ch-catalog";
import type { IntegrationCategory } from "@/lib/types/integration";

export interface IntegralizacaoManualEntry {
  id: number;
  tipoCh: ChType;
  horas: number;
}

export interface IntegralizacaoCategoryDetail extends IntegrationCategory {
  manualEntries: IntegralizacaoManualEntry[];
}

export interface IntegralizacaoResponse {
  totalHours: number;
  totalDone: number;
  percent: number;
  percentSigaa: number | null;
  categories: IntegralizacaoCategoryDetail[];
}

export interface PostIntegralizacaoBody {
  tipoCh: ChType;
  horas: number;
}
