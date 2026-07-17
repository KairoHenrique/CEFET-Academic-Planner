"use client";

import { useMemo, useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import {
  BILLING_PLAN_DEFINITIONS,
  resolvePlanDurationDays,
} from "@/lib/billing/plan-catalog";
import type { DevGiftKeyView } from "@/lib/dev-panel/types";
import {
  useDevCreateGiftKeys,
  useDevGiftKeys,
  useDevRevokeGiftKey,
} from "@/hooks/useDevPanel";
import { DevSectionHeader } from "@/components/dev/DevSectionHeader";
import {
  DevStatusPill,
  giftKeyStatusTone,
} from "@/components/dev/DevStatusPill";
import { formatDevDateTime } from "@/components/dev/dev-panel-formatters";

const PAID_PLAN_OPTIONS = BILLING_PLAN_DEFINITIONS.filter(
  (plan) => plan.kind === "paid"
);

interface Feedback {
  kind: "success" | "error";
  message: string;
}

const STATUS_LABELS: Record<string, string> = {
  available: "Disponível",
  redeemed: "Resgatada",
  revoked: "Revogada",
  expired: "Expirada",
};

function resolveErrorMessage(caught: unknown, fallback: string): string {
  return caught instanceof ApiClientError ? caught.message : fallback;
}

function GiftKeyForm({
  onGenerated,
  onFeedback,
}: {
  onGenerated: (codes: string[]) => void;
  onFeedback: (feedback: Feedback | null) => void;
}) {
  const [planId, setPlanId] = useState<string>("five_year");
  const [days, setDays] = useState<string>(
    String(resolvePlanDurationDays("five_year"))
  );
  const [count, setCount] = useState<string>("1");
  const [label, setLabel] = useState<string>("");

  const createMutation = useDevCreateGiftKeys();

  const parsedDays = useMemo(() => {
    const value = Number(days);
    return Number.isInteger(value) && value > 0 ? value : null;
  }, [days]);

  const parsedCount = useMemo(() => {
    const value = Number(count);
    return Number.isInteger(value) && value >= 1 && value <= 50 ? value : null;
  }, [count]);

  function handlePlanChange(nextPlanId: string) {
    setPlanId(nextPlanId);
    setDays(String(resolvePlanDurationDays(nextPlanId)));
  }

  async function handleGenerate() {
    onFeedback(null);
    if (!parsedDays) {
      onFeedback({ kind: "error", message: "Informe um número de dias válido." });
      return;
    }
    if (!parsedCount) {
      onFeedback({ kind: "error", message: "Quantidade deve ser entre 1 e 50." });
      return;
    }

    try {
      const keys = await createMutation.mutateAsync({
        planId,
        days: parsedDays,
        count: parsedCount,
        label: label.trim() || undefined,
      });
      onGenerated(keys.map((key) => key.code));
      onFeedback({
        kind: "success",
        message: `${keys.length} código(s) gerado(s) · ${parsedDays} dias.`,
      });
    } catch (caught) {
      onFeedback({
        kind: "error",
        message: resolveErrorMessage(caught, "Falha ao gerar códigos."),
      });
    }
  }

  return (
    <div className="dev-giftkey-form">
      <div className="dev-grant-fields">
        <label className="form-field">
          <span className="form-label">Plano</span>
          <select
            className="form-input"
            value={planId}
            onChange={(event) => handlePlanChange(event.target.value)}
            disabled={createMutation.isPending}
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
            disabled={createMutation.isPending}
          />
        </label>

        <label className="form-field">
          <span className="form-label">Quantidade</span>
          <input
            type="number"
            className="form-input"
            min={1}
            max={50}
            step={1}
            value={count}
            onChange={(event) => setCount(event.target.value)}
            disabled={createMutation.isPending}
          />
        </label>

        <label className="form-field">
          <span className="form-label">Rótulo (opcional)</span>
          <input
            type="text"
            className="form-input"
            maxLength={80}
            placeholder="ex.: amigos-turma-2026"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            disabled={createMutation.isPending}
          />
        </label>
      </div>

      <div className="dev-grant-actions">
        <button
          type="button"
          className="btn-gold dev-action-btn"
          disabled={createMutation.isPending || !parsedDays || !parsedCount}
          onClick={() => void handleGenerate()}
        >
          {createMutation.isPending ? "Gerando…" : "Gerar código(s)"}
        </button>
      </div>
    </div>
  );
}

function GiftKeyRow({ item }: { item: DevGiftKeyView }) {
  const revokeMutation = useDevRevokeGiftKey();
  const canRevoke = item.status === "available";

  return (
    <tr>
      <td>
        <code className="dev-giftkey-code">{item.code}</code>
      </td>
      <td>{item.durationDays}d</td>
      <td>
        <DevStatusPill tone={giftKeyStatusTone(item.status)}>
          {STATUS_LABELS[item.status] ?? item.status}
        </DevStatusPill>
      </td>
      <td>{item.internalLabel ?? "—"}</td>
      <td>
        <time dateTime={item.createdAt}>{formatDevDateTime(item.createdAt)}</time>
      </td>
      <td>
        {canRevoke ? (
          <button
            type="button"
            className="btn-outline btn-danger dev-action-btn dev-action-btn--sm"
            disabled={revokeMutation.isPending}
            onClick={() => void revokeMutation.mutateAsync(item.code)}
          >
            {revokeMutation.isPending ? "…" : "Revogar"}
          </button>
        ) : (
          <span className="dev-table-meta">—</span>
        )}
      </td>
    </tr>
  );
}

export function DevGiftKeysSection() {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const keysQuery = useDevGiftKeys(true);

  const keys = keysQuery.data ?? [];

  async function handleCopyAll() {
    if (generatedCodes.length === 0) return;
    try {
      await navigator.clipboard.writeText(generatedCodes.join("\n"));
      setFeedback({ kind: "success", message: "Código(s) copiado(s)." });
    } catch {
      setFeedback({ kind: "error", message: "Não foi possível copiar." });
    }
  }

  return (
    <section className="card col-12" aria-labelledby="dev-giftkeys-title">
      <DevSectionHeader
        icon="star"
        title="Chaves de plano"
        titleId="dev-giftkeys-title"
        subtitle="Gere códigos para quem ainda não tem conta e revogue os que sobraram."
      />

      <GiftKeyForm onGenerated={setGeneratedCodes} onFeedback={setFeedback} />

      {generatedCodes.length > 0 ? (
        <div className="dev-giftkey-generated">
          <div className="dev-giftkey-generated-list">
            {generatedCodes.map((code) => (
              <code key={code} className="dev-grant-code-value">
                {code}
              </code>
            ))}
          </div>
          <button
            type="button"
            className="btn-outline dev-action-btn"
            onClick={() => void handleCopyAll()}
          >
            Copiar tudo
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

      <div className="dev-giftkey-list">
        <h3 className="dev-sync-queue-subtitle">Códigos recentes</h3>
        {keysQuery.isLoading ? (
          <p className="dev-empty-state dev-empty-state--compact" role="status">
            Carregando códigos…
          </p>
        ) : keys.length === 0 ? (
          <p className="dev-empty-state dev-empty-state--compact">
            Nenhum código gerado ainda.
          </p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Duração</th>
                  <th>Status</th>
                  <th>Rótulo</th>
                  <th>Criado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {keys.map((item) => (
                  <GiftKeyRow key={item.code} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
