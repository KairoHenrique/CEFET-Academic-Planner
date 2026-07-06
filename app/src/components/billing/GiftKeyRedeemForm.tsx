"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/Input";
import { PlannerNotice } from "@/components/ui/PlannerNotice";
import { ApiClientError, postBillingRedeemKey } from "@/lib/api/client";
import {
  clearPendingGiftKey,
  savePendingGiftKey,
} from "@/lib/billing/gift-keys/pending-gift-key-storage";
import { PERFIL_QUERY_KEY } from "@/hooks/usePerfil";
import { queryKeys } from "@/lib/query/keys";
import { isAuthenticated } from "@/lib/auth/session";

interface GiftKeyRedeemFormProps {
  variant?: "card" | "inline" | "sidebar" | "compact";
  deferUntilAuth?: boolean;
  onSuccess?: (planLabel: string) => void;
}

function normalizeGiftInput(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export function GiftKeyRedeemForm({
  variant = "card",
  deferUntilAuth = false,
  onSuccess,
}: GiftKeyRedeemFormProps) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeEpoch, setNoticeEpoch] = useState(0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const normalized = normalizeGiftInput(code);
    if (normalized.length !== 8) {
      setErrorMessage("Informe uma chave válida com 8 caracteres.");
      setNoticeEpoch((value) => value + 1);
      return;
    }

    const shouldDefer = deferUntilAuth && !isAuthenticated();
    if (shouldDefer) {
      savePendingGiftKey(normalized);
      setSuccessMessage(
        "Chave salva. Ela será resgatada automaticamente após você entrar."
      );
      setCode("");
      return;
    }

    setSubmitting(true);
    try {
      const result = await postBillingRedeemKey({ code: normalized });
      clearPendingGiftKey();
      void queryClient.invalidateQueries({ queryKey: PERFIL_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: queryKeys.billingAccount() });
      setSuccessMessage(`Plano ${result.planLabel} ativado com sucesso.`);
      setCode("");
      onSuccess?.(result.planLabel);
    } catch (error) {
      setNoticeEpoch((value) => value + 1);
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Não foi possível resgatar a chave."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className={`gift-key-redeem gift-key-redeem--${variant}`}
      aria-labelledby={variant === "compact" ? undefined : "gift-key-redeem-title"}
      aria-label={variant === "compact" ? "Resgate de chave promocional" : undefined}
    >
      <div className="gift-key-redeem-head">
        {variant === "compact" ? (
          <p className="gift-key-redeem-compact-label">Chave promocional</p>
        ) : (
          <>
            <h3 id="gift-key-redeem-title" className="gift-key-redeem-title">
              Chave de plano
            </h3>
            <p className="gift-key-redeem-copy">
              Possui um código promocional? Digite os 8 caracteres.
            </p>
          </>
        )}
      </div>

      <form className="gift-key-redeem-form" onSubmit={(event) => void handleSubmit(event)}>
        {variant === "compact" ? (
          <input
            id="gift-key-code-compact"
            className="gift-key-redeem-input"
            value={code}
            onChange={(event) => setCode(normalizeGiftInput(event.target.value))}
            placeholder="Ex.: AB12CD34"
            autoComplete="off"
            inputMode="text"
            disabled={submitting}
            maxLength={8}
            aria-label="Código promocional de 8 caracteres"
            spellCheck={false}
          />
        ) : (
          <Input
            label="Código"
            value={code}
            onChange={(event) => setCode(normalizeGiftInput(event.target.value))}
            placeholder="Ex.: AB12CD34"
            autoComplete="off"
            inputMode="text"
            disabled={submitting}
            maxLength={8}
          />
        )}
        <button
          type="submit"
          className="gift-key-redeem-submit"
          disabled={submitting || code.length < 8}
          aria-busy={submitting}
        >
          {submitting ? "Resgatando…" : variant === "compact" ? "Resgatar" : "Resgatar chave"}
        </button>
      </form>

      {successMessage ? (
        <p className="gift-key-redeem-success" role="status">
          {successMessage}
        </p>
      ) : null}

      <PlannerNotice
        open={Boolean(errorMessage)}
        message={errorMessage}
        noticeKey={noticeEpoch}
        kicker="Resgate indisponível"
        onDismiss={() => setErrorMessage(null)}
      />
    </section>
  );
}
