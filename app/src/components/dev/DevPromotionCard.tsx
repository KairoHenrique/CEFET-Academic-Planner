"use client";

import { useMemo, useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import type {
  DevAccountPublicView,
  DevRobotScope,
} from "@/lib/dev-panel/types";
import { useDevDispatchPromotion } from "@/hooks/useDevPanel";
import { DevSectionHeader } from "@/components/dev/DevSectionHeader";

interface DevPromotionCardProps {
  selectedAccount: DevAccountPublicView | null;
}

interface Feedback {
  kind: "success" | "error";
  message: string;
}

const HEADLINE_MAX = 120;
const MESSAGE_MAX = 2_000;

export function DevPromotionCard({ selectedAccount }: DevPromotionCardProps) {
  const [scope, setScope] = useState<DevRobotScope>("global");
  const [headline, setHeadline] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const dispatchMutation = useDevDispatchPromotion();
  const pending = dispatchMutation.isPending;

  const canSubmit = useMemo(() => {
    const hasContent = headline.trim().length >= 3 && message.trim().length >= 3;
    const hasTarget = scope === "global" || Boolean(selectedAccount);
    return hasContent && hasTarget;
  }, [headline, message, scope, selectedAccount]);

  async function handleDispatch() {
    setFeedback(null);

    if (scope === "individual" && !selectedAccount) {
      setFeedback({
        kind: "error",
        message: "Selecione uma conta na tabela acima.",
      });
      return;
    }

    try {
      const result = await dispatchMutation.mutateAsync({
        scope,
        accountRef:
          scope === "individual" ? selectedAccount?.accountRef : undefined,
        headline: headline.trim(),
        message: message.trim(),
      });
      setFeedback({
        kind: "success",
        message: `Campanha enviada: ${result.queued} enfileirado(s) · ${result.sent} enviado(s) via ${result.provider} (${result.targets} alvo(s)).`,
      });
      setHeadline("");
      setMessage("");
    } catch (caught) {
      setFeedback({
        kind: "error",
        message:
          caught instanceof ApiClientError
            ? caught.message
            : "Falha ao disparar a promoção.",
      });
    }
  }

  return (
    <article className="card dev-grant-card col-12">
      <DevSectionHeader
        icon="star"
        title="Disparar promoção"
        subtitle="Envia um e-mail de campanha para todas as contas ou para a conta selecionada. O disparo já faz o flush da fila de e-mail."
      />

      <div className="dev-grant-fields">
        <label className="form-field">
          <span className="form-label">Destino</span>
          <select
            className="form-input"
            value={scope}
            onChange={(event) => setScope(event.target.value as DevRobotScope)}
            disabled={pending}
          >
            <option value="global">Todas as contas com e-mail</option>
            <option value="individual">Somente a conta selecionada</option>
          </select>
        </label>

        <label className="form-field">
          <span className="form-label">Título (assunto)</span>
          <input
            type="text"
            className="form-input"
            maxLength={HEADLINE_MAX}
            placeholder="ex.: 20% de desconto no plano anual"
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            disabled={pending}
          />
        </label>
      </div>

      <label className="form-field">
        <span className="form-label">Mensagem</span>
        <textarea
          className="form-input"
          rows={5}
          maxLength={MESSAGE_MAX}
          placeholder="Escreva o corpo do e-mail. Links começando com http viram clicáveis automaticamente."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={pending}
        />
      </label>

      {scope === "individual" ? (
        selectedAccount ? (
          <p className="dev-grant-target">
            Conta: <strong>{selectedAccount.displayName}</strong>{" "}
            <span className="dev-table-meta">{selectedAccount.cpfMasked}</span>
          </p>
        ) : (
          <p className="dev-empty-state dev-empty-state--compact">
            Selecione uma conta na tabela acima.
          </p>
        )
      ) : null}

      <div className="dev-grant-actions">
        <button
          type="button"
          className="btn-gold dev-action-btn"
          disabled={pending || !canSubmit}
          onClick={() => void handleDispatch()}
        >
          {pending ? "Enviando…" : "Disparar promoção"}
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
