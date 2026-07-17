"use client";

import { useMemo, useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import {
  BILLING_PLAN_DEFINITIONS,
  resolvePlanDurationDays,
} from "@/lib/billing/plan-catalog";
import type { DevAccountPublicView } from "@/lib/dev-panel/types";
import { useDevGrantSubscription } from "@/hooks/useDevPanel";
import { DevSectionHeader } from "@/components/dev/DevSectionHeader";

const PAID_PLAN_OPTIONS = BILLING_PLAN_DEFINITIONS.filter(
  (plan) => plan.kind === "paid"
);

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
  const [planId, setPlanId] = useState<string>("five_year");
  const [days, setDays] = useState<string>(
    String(resolvePlanDurationDays("five_year"))
  );
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const grantMutation = useDevGrantSubscription();

  const parsedDays = useMemo(() => {
    const value = Number(days);
    return Number.isInteger(value) && value > 0 ? value : null;
  }, [days]);

  const pending = grantMutation.isPending;

  function handlePlanChange(nextPlanId: string) {
    setPlanId(nextPlanId);
    setDays(String(resolvePlanDurationDays(nextPlanId)));
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
        message:
          caught instanceof ApiClientError
            ? caught.message
            : "Falha ao conceder o plano.",
      });
    }
  }

  return (
    <article className="card dev-grant-card col-12">
      <DevSectionHeader
        icon="chart"
        title="Conceder plano"
        subtitle="Soma dias ao tempo restante da conta selecionada. Para quem não tem conta, use a aba Chaves."
      />

      {selectedAccount ? (
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
        <button
          type="button"
          className="btn-gold dev-action-btn"
          disabled={pending || !selectedAccount || !parsedDays}
          onClick={() => void handleGrant()}
        >
          {pending ? "Concedendo…" : "Conceder plano"}
        </button>
      </div>

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
