"use client";

import { useMemo, useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import type { BillingPlanView } from "@/lib/types/billing-api";
import { formatBrlCents } from "@/lib/billing/format-brl-cents";
import { useDevDispatchPromotion } from "@/hooks/useDevPanel";

interface DevPromotionFormProps {
  paidPlans: BillingPlanView[];
}

interface Feedback {
  kind: "success" | "error";
  message: string;
}

function parseReaisToCents(value: string): number | null {
  const normalized = value.replace(/\./g, "").replace(",", ".").trim();
  const reais = Number(normalized);
  if (!Number.isFinite(reais) || reais <= 0) {
    return null;
  }
  return Math.round(reais * 100);
}

export function DevPromotionForm({ paidPlans }: DevPromotionFormProps) {
  const [planId, setPlanId] = useState<string>(paidPlans[0]?.id ?? "month");
  const [priceInput, setPriceInput] = useState("");
  const [durationDays, setDurationDays] = useState("7");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const dispatchMutation = useDevDispatchPromotion();
  const pending = dispatchMutation.isPending;

  const selectedPlan = paidPlans.find((plan) => plan.id === planId) ?? null;
  const basePriceCents = selectedPlan?.priceCents ?? null;
  const promoPriceCents = parseReaisToCents(priceInput);

  const discountPercent = useMemo(() => {
    if (!basePriceCents || !promoPriceCents || promoPriceCents >= basePriceCents) {
      return null;
    }
    return Math.round(
      ((basePriceCents - promoPriceCents) / basePriceCents) * 100
    );
  }, [basePriceCents, promoPriceCents]);

  const parsedDuration = useMemo(() => {
    const value = Number(durationDays);
    return Number.isInteger(value) && value >= 1 && value <= 365 ? value : null;
  }, [durationDays]);

  const canSubmit =
    Boolean(discountPercent && discountPercent > 0) && Boolean(parsedDuration);

  async function handleSubmit() {
    setFeedback(null);
    if (!promoPriceCents || !basePriceCents || promoPriceCents >= basePriceCents) {
      setFeedback({
        kind: "error",
        message: "Informe um preço promocional menor que o preço atual.",
      });
      return;
    }
    if (!parsedDuration) {
      setFeedback({ kind: "error", message: "Duração deve ser 1 a 365 dias." });
      return;
    }

    try {
      const result = await dispatchMutation.mutateAsync({
        planId,
        promoPriceCents,
        durationDays: parsedDuration,
      });
      setFeedback({
        kind: "success",
        message: `Promoção publicada: -${result.discountPercent}% no ${planId} · e-mail para ${result.targets} conta(s) (${result.sent} enviado via ${result.provider}).`,
      });
      setPriceInput("");
    } catch (caught) {
      setFeedback({
        kind: "error",
        message:
          caught instanceof ApiClientError
            ? caught.message
            : "Falha ao publicar a promoção.",
      });
    }
  }

  return (
    <div className="dev-promo-form">
      <div className="dev-grant-fields">
        <label className="form-field">
          <span className="form-label">Plano em oferta</span>
          <select
            className="form-input"
            value={planId}
            onChange={(event) => setPlanId(event.target.value)}
            disabled={pending}
          >
            {paidPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.label} ({plan.priceLabel})
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span className="form-label">Preço promocional (R$)</span>
          <input
            type="text"
            inputMode="decimal"
            className="form-input"
            placeholder={
              basePriceCents ? `menor que ${formatBrlCents(basePriceCents)}` : "0,00"
            }
            value={priceInput}
            onChange={(event) => setPriceInput(event.target.value)}
            disabled={pending}
          />
        </label>

        <label className="form-field">
          <span className="form-label">Duração (dias)</span>
          <input
            type="number"
            min={1}
            max={365}
            className="form-input"
            value={durationDays}
            onChange={(event) => setDurationDays(event.target.value)}
            disabled={pending}
          />
        </label>
      </div>

      {discountPercent && discountPercent > 0 && basePriceCents ? (
        <p className="dev-promo-preview" role="status">
          Desconto de <strong>{discountPercent}%</strong> · de{" "}
          <s>{formatBrlCents(basePriceCents)}</s> por{" "}
          <strong>{formatBrlCents(promoPriceCents ?? 0)}</strong>. Banner e e-mail
          gerados automaticamente.
        </p>
      ) : null}

      <div className="dev-grant-actions">
        <button
          type="button"
          className="btn-gold dev-action-btn"
          disabled={pending || !canSubmit}
          onClick={() => void handleSubmit()}
        >
          {pending ? "Publicando…" : "Publicar promoção"}
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
    </div>
  );
}
