"use client";

import { useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import type {
  DevAccountPublicView,
  DevSubscriptionHistoryItem,
} from "@/lib/dev-panel/types";
import {
  useDevRevokeSubscription,
  useDevSubscriptions,
} from "@/hooks/useDevPanel";
import { DevSectionHeader } from "@/components/dev/DevSectionHeader";
import {
  DevStatusPill,
  subscriptionStatusTone,
} from "@/components/dev/DevStatusPill";
import { formatDevDateTime } from "@/components/dev/dev-panel-formatters";

interface DevSubscriptionHistoryCardProps {
  selectedAccount: DevAccountPublicView | null;
}

interface Feedback {
  kind: "success" | "error";
  message: string;
}

const STATUS_LABELS: Record<string, string> = {
  trial_active: "Trial ativo",
  trial_expired: "Trial expirado",
  pending_payment: "Aguardando pgto",
  active: "Ativo",
  expired: "Expirado",
  cancelled: "Cancelado",
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function HistoryTable({ items }: { items: DevSubscriptionHistoryItem[] }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Plano</th>
            <th>Status</th>
            <th>Origem</th>
            <th>Expira</th>
            <th>Criado</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.planLabel}</td>
              <td>
                <DevStatusPill tone={subscriptionStatusTone(item.status)}>
                  {statusLabel(item.status)}
                </DevStatusPill>
              </td>
              <td>{item.source}</td>
              <td>
                <time dateTime={item.expiresAt}>
                  {formatDevDateTime(item.expiresAt)}
                </time>
              </td>
              <td>
                <time dateTime={item.createdAt}>
                  {formatDevDateTime(item.createdAt)}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DevSubscriptionHistoryCard({
  selectedAccount,
}: DevSubscriptionHistoryCardProps) {
  const accountRef = selectedAccount?.accountRef ?? null;
  const historyQuery = useDevSubscriptions(accountRef);
  const revokeMutation = useDevRevokeSubscription();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const items = historyQuery.data?.subscriptions ?? [];
  const hasActive = items.some((item) => item.status === "active");

  async function handleRevoke() {
    if (!accountRef) return;
    setFeedback(null);
    try {
      const result = await revokeMutation.mutateAsync(accountRef);
      setFeedback({
        kind: "success",
        message: `${result.cancelled} assinatura(s) revogada(s).`,
      });
    } catch (caught) {
      setFeedback({
        kind: "error",
        message:
          caught instanceof ApiClientError
            ? caught.message
            : "Falha ao revogar assinatura.",
      });
    }
  }

  return (
    <article className="card dev-grant-card col-12">
      <DevSectionHeader
        icon="clipboard"
        title="Assinaturas da conta"
        subtitle="Histórico e revogação do plano ativo da conta selecionada."
      />

      {!selectedAccount ? (
        <p className="dev-empty-state">Selecione uma conta na tabela acima.</p>
      ) : (
        <>
          <div className="dev-grant-actions">
            <button
              type="button"
              className="btn-outline btn-danger dev-action-btn"
              disabled={!hasActive || revokeMutation.isPending}
              onClick={() => void handleRevoke()}
            >
              {revokeMutation.isPending ? "Revogando…" : "Revogar plano ativo"}
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

          {historyQuery.isLoading ? (
            <p className="dev-empty-state dev-empty-state--compact" role="status">
              Carregando histórico…
            </p>
          ) : items.length === 0 ? (
            <p className="dev-empty-state dev-empty-state--compact">
              Nenhuma assinatura registrada para esta conta.
            </p>
          ) : (
            <HistoryTable items={items} />
          )}
        </>
      )}
    </article>
  );
}
