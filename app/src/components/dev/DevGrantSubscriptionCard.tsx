"use client";

import { useMemo, useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import {
  BILLING_PLAN_DEFINITIONS,
  resolvePlanDurationDays,
} from "@/lib/billing/plan-catalog";
import type { DevAccountPublicView } from "@/lib/dev-panel/types";
import {
  useDevCreateGiftKey,
  useDevGrantSubscription,
} from "@/hooks/useDevPanel";
import { DevSectionHeader } from "@/components/dev/DevSectionHeader";

const PAID_PLAN_OPTIONS = BILLING_PLAN_DEFINITIONS.filter(
  (plan) => plan.kind === "paid"
);

type GrantMode = "account" | "code";

interface DevGrantSubscriptionCardProps {
  selectedAccount: DevAccountPublicView | null;
}

interface Feedback {
  kind: "success" | "error";
  message: string;
}

function formatExpiry(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function DevGrantSubscriptionCard({
  selectedAccount,
}: DevGrantSubscriptionCardProps) {
  const [mode, setMode] = useState<GrantMode>("account");
  const [planId, setPlanId] = useState<string>("five_year");
  const [days, setDays] = useState<string>(
    String(resolvePlanDurationDays("five_year"))
  );
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const grantMutation = useDevGrantSubscription();
  const giftKeyMutation = useDevCreateGiftKey();

  const parsedDays = useMemo(() => {
    const value = Number(days);
    return Number.isInteger(value) && value > 0 ? value : null;
  }, [days]);

  const pending = grantMutation.isPending || giftKeyMutation.isPending;

  function handleModeChange(nextMode: GrantMode) {
    setMode(nextMode);
    setFeedback(null);
    setGeneratedCode(null);
  }

  function handlePlanChange(nextPlanId: string) {
    setPlanId(nextPlanId);
    setDays(String(resolvePlanDurationDays(nextPlanId)));
  }

  function resolveErrorMessage(caught: unknown, fallback: string): string {
    return caught instanceof ApiClientError ? caught.message : fallback;
  }

  async function handleGrant() {
    setFeedback(null);

    if (!selectedAccount) {
      setFeedback({
        kind: "error",
        message: "Selecione uma conta na tabela acima.",
      });
      return;
    }
    if (!parsedDays) {
      setFeedback({ kind: "error", message: "Informe um número de dias válido." });
      return;
    }

    try {
      const result = await grantMutation.mutateAsync({
        accountRef: selectedAccount.accountRef,
        planId,
        days: parsedDays,
      });
      setFeedback({
        kind: "success",
        message: `${result.planLabel} concedido (somado): +${result.subscription.daysGranted} dias · expira em ${formatExpiry(result.subscription.expiresAt)}.`,
      });
    } catch (caught) {
      setFeedback({
        kind: "error",
        message: resolveErrorMessage(caught, "Falha ao conceder o plano."),
      });
    }
  }

  async function handleGenerateCode() {
    setFeedback(null);
    setGeneratedCode(null);

    if (!parsedDays) {
      setFeedback({ kind: "error", message: "Informe um número de dias válido." });
      return;
    }

    try {
      const result = await giftKeyMutation.mutateAsync({ planId, days: parsedDays });
      setGeneratedCode(result.code);
      setFeedback({
        kind: "success",
        message: `Código gerado: ${result.durationDays} dias. A pessoa resgata no cadastro/login.`,
      });
    } catch (caught) {
      setFeedback({
        kind: "error",
        message: resolveErrorMessage(caught, "Falha ao gerar o código."),
      });
    }
  }

  async function handleCopyCode() {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setFeedback({ kind: "success", message: "Código copiado." });
    } catch {
      setFeedback({ kind: "error", message: "Não foi possível copiar automaticamente." });
    }
  }

  const isCodeMode = mode === "code";
  const grantDisabled = pending || !selectedAccount || !parsedDays;
  const generateDisabled = pending || !parsedDays;

  return (
    <article className="card dev-grant-card col-12">
      <DevSectionHeader
        icon="chart"
        title="Conceder plano"
        subtitle="Some dias a uma conta existente ou gere um código para quem ainda não tem conta."
      />

      <div className="dev-grant-modes" role="tablist" aria-label="Modo de concessão">
        <button
          type="button"
          role="tab"
          aria-selected={!isCodeMode}
          className={`dev-grant-mode-btn${!isCodeMode ? " is-active" : ""}`}
          onClick={() => handleModeChange("account")}
          disabled={pending}
        >
          Conta selecionada
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isCodeMode}
          className={`dev-grant-mode-btn${isCodeMode ? " is-active" : ""}`}
          onClick={() => handleModeChange("code")}
          disabled={pending}
        >
          Sem conta (código)
        </button>
      </div>

      {isCodeMode ? (
        <p className="dev-grant-target">
          Gera um código aleatório salvo no banco. A pessoa informa o código no
          cadastro/login para ativar o plano.
        </p>
      ) : selectedAccount ? (
        <p className="dev-grant-target">
          Conta: <strong>{selectedAccount.displayName}</strong>{" "}
          <span className="dev-table-meta">{selectedAccount.cpfMasked}</span>
        </p>
      ) : (
        <p className="dev-empty-state">Selecione uma conta na tabela acima.</p>
      )}

      <div className="dev-grant-fields">
        <label className="form-field">
          <span className="form-label">Plano</span>
          <select
            className="form-input"
            value={planId}
            onChange={(event) => handlePlanChange(event.target.value)}
            disabled={pending}
          >
            {PAID_PLAN_OPTIONS.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.label} ({plan.durationLabel})
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span className="form-label">Dias</span>
          <input
            type="number"
            className="form-input"
            min={1}
            max={36500}
            step={1}
            value={days}
            onChange={(event) => setDays(event.target.value)}
            disabled={pending}
          />
        </label>
      </div>

      <div className="dev-grant-actions">
        {isCodeMode ? (
          <button
            type="button"
            className="btn-gold dev-action-btn"
            disabled={generateDisabled}
            onClick={() => void handleGenerateCode()}
          >
            {giftKeyMutation.isPending ? "Gerando…" : "Gerar código"}
          </button>
        ) : (
          <button
            type="button"
            className="btn-gold dev-action-btn"
            disabled={grantDisabled}
            onClick={() => void handleGrant()}
          >
            {grantMutation.isPending ? "Concedendo…" : "Conceder plano"}
          </button>
        )}
      </div>

      {generatedCode ? (
        <div className="dev-grant-code">
          <code className="dev-grant-code-value">{generatedCode}</code>
          <button
            type="button"
            className="btn-ghost dev-action-btn"
            onClick={() => void handleCopyCode()}
          >
            Copiar
          </button>
        </div>
      ) : null}

      {feedback ? (
        <p
          className={
            feedback.kind === "success"
              ? "form-success dev-grant-feedback"
              : "form-error dev-grant-feedback"
          }
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      ) : null}
    </article>
  );
}
