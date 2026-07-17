"use client";

import { AlertBanner } from "@/components/ui/AlertBanner";
import { useAlertBanners } from "@/hooks/useAlertBanners";

interface IntegralizacaoAlertBannerProps {
  /** Exibe botão para a página de integralização (uso fora dela, ex.: dashboard). */
  showCta?: boolean;
}

/** B36/F24 — banner de marcos de integralização (perto de concluir / concluído). */
export function IntegralizacaoAlertBanner({
  showCta = false,
}: IntegralizacaoAlertBannerProps) {
  const { integralizacao, integralizacaoHasCompleted, loading } =
    useAlertBanners();

  if (loading || integralizacao.length === 0) return null;

  return (
    <div className="col-12">
      <AlertBanner
        tone={integralizacaoHasCompleted ? "success" : "warning"}
        icon={integralizacaoHasCompleted ? "check" : "graduation"}
        title={
          integralizacaoHasCompleted
            ? "Categoria de CH concluída"
            : "Você está perto de concluir uma categoria"
        }
        items={integralizacao}
        cta={
          showCta
            ? { href: "/integralizacao", label: "Ver integralização" }
            : undefined
        }
      />
    </div>
  );
}
