import { getConfig, setConfig } from "@/lib/db/queries";

export const SIGAA_CH_TOTAL_CURRICULO_KEY = "sigaa.ch.total_curriculo";
export const SIGAA_CH_PERCENT_INTEGRALIZADO_KEY = "sigaa.ch.percent_integralizado";

export interface SigaaIntegralizacaoResumo {
  totalCurriculo: number | null;
  percentIntegralizado: number | null;
}

export function persistSigaaIntegralizacaoResumo(resumo: SigaaIntegralizacaoResumo): void {
  if (resumo.totalCurriculo !== null) {
    setConfig(SIGAA_CH_TOTAL_CURRICULO_KEY, String(resumo.totalCurriculo));
  }
  if (resumo.percentIntegralizado !== null) {
    setConfig(SIGAA_CH_PERCENT_INTEGRALIZADO_KEY, String(resumo.percentIntegralizado));
  }
}

export function readSigaaIntegralizacaoResumo(): SigaaIntegralizacaoResumo {
  const totalRaw = getConfig(SIGAA_CH_TOTAL_CURRICULO_KEY);
  const percentRaw = getConfig(SIGAA_CH_PERCENT_INTEGRALIZADO_KEY);

  const totalCurriculo = totalRaw ? Number(totalRaw) : null;
  const percentIntegralizado = percentRaw ? Number(percentRaw) : null;

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
  };
}
