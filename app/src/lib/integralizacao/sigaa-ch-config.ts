import { getConfig, setConfig } from "@/lib/db/queries";

export const SIGAA_CH_TOTAL_CURRICULO_KEY = "sigaa.ch.total_curriculo";
export const SIGAA_CH_PERCENT_INTEGRALIZADO_KEY = "sigaa.ch.percent_integralizado";
export const SIGAA_CH_TOTAL_INTEGRALIZADO_KEY = "sigaa.ch.total_integralizado";
export const SIGAA_CH_FROM_HISTORICO_PDF_KEY = "sigaa.ch.from_historico_pdf";

export interface SigaaIntegralizacaoResumo {
  totalCurriculo: number | null;
  percentIntegralizado: number | null;
  totalIntegralizado?: number | null;
  fromHistoricoPdf?: boolean;
}

export function persistSigaaIntegralizacaoResumo(
  resumo: SigaaIntegralizacaoResumo
): void {
  if (resumo.totalCurriculo !== null) {
    setConfig(SIGAA_CH_TOTAL_CURRICULO_KEY, String(resumo.totalCurriculo));
  }
  if (resumo.percentIntegralizado !== null) {
    setConfig(SIGAA_CH_PERCENT_INTEGRALIZADO_KEY, String(resumo.percentIntegralizado));
  }
  if (resumo.totalIntegralizado != null) {
    setConfig(SIGAA_CH_TOTAL_INTEGRALIZADO_KEY, String(resumo.totalIntegralizado));
  }
  if (resumo.fromHistoricoPdf !== undefined) {
    setConfig(SIGAA_CH_FROM_HISTORICO_PDF_KEY, resumo.fromHistoricoPdf ? "1" : "0");
  }
}

export const SIGAA_CH_KEYS = [
  SIGAA_CH_TOTAL_CURRICULO_KEY,
  SIGAA_CH_PERCENT_INTEGRALIZADO_KEY,
  SIGAA_CH_TOTAL_INTEGRALIZADO_KEY,
  SIGAA_CH_FROM_HISTORICO_PDF_KEY,
] as const;

/**
 * Constrói o resumo a partir de um leitor de configuração agnóstico de backend
 * (SQLite `getConfig` ou Postgres `configuracoes`). Centraliza o parsing/validação
 * para não duplicar regras entre os dois caminhos.
 */
export function buildSigaaResumoFromReader(
  read: (chave: string) => string | null
): SigaaIntegralizacaoResumo {
  const totalRaw = read(SIGAA_CH_TOTAL_CURRICULO_KEY);
  const percentRaw = read(SIGAA_CH_PERCENT_INTEGRALIZADO_KEY);
  const integralizadoRaw = read(SIGAA_CH_TOTAL_INTEGRALIZADO_KEY);
  const fromHistoricoRaw = read(SIGAA_CH_FROM_HISTORICO_PDF_KEY);

  const totalCurriculo = totalRaw ? Number(totalRaw) : null;
  const percentIntegralizado = percentRaw ? Number(percentRaw) : null;
  const totalIntegralizado = integralizadoRaw ? Number(integralizadoRaw) : null;

  return {
    totalCurriculo:
      totalCurriculo !== null && Number.isFinite(totalCurriculo) && totalCurriculo > 0
        ? totalCurriculo
        : null,
    percentIntegralizado:
      percentIntegralizado !== null &&
      Number.isFinite(percentIntegralizado) &&
      percentIntegralizado >= 0
        ? percentIntegralizado
        : null,
    totalIntegralizado:
      totalIntegralizado !== null &&
      Number.isFinite(totalIntegralizado) &&
      totalIntegralizado >= 0
        ? totalIntegralizado
        : null,
    fromHistoricoPdf: fromHistoricoRaw === "1",
  };
}

export function readSigaaIntegralizacaoResumo(): SigaaIntegralizacaoResumo {
  return buildSigaaResumoFromReader(getConfig);
}
