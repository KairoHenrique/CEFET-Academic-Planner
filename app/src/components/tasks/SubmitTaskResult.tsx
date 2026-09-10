"use client";

import { Icon } from "@/components/ui/Icon";

type Props = {
  ok: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
};

export function SubmitTaskResult({ ok, title, message, onDismiss, onRetry }: Props) {
  return (
    <div
      className={`task-submit-result${ok ? " is-ok" : " is-fail"}`}
      role={ok ? "status" : "alert"}
    >
      <span className="task-submit-result-icon" aria-hidden>
        <Icon name={ok ? "check" : "warning"} size={22} />
      </span>
      <h3 className="task-submit-result-title">{title}</h3>
      <p className="modal-hint">{message}</p>
      <div className="modal-form-actions">
        {!ok && onRetry ? (
          <button type="button" className="btn-outline" onClick={onRetry}>
            Tentar de novo
          </button>
        ) : null}
        <button type="button" className="btn-gold" onClick={onDismiss}>
          <Icon name="check" size={14} />
          {ok ? "Entendi" : "Fechar"}
        </button>
      </div>
    </div>
  );
}
