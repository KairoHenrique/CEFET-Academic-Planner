"use client";

import { useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import type {
  DevOrchestratorPlanItem,
  DevQueueJobView,
  DevSyncStatusResponse,
} from "@/lib/dev-panel/types";
import {
  useDevAccountEmailsCron,
  useDevOrchestratorTick,
  useDevRetrySyncJob,
} from "@/hooks/useDevPanel";
import { DevSectionHeader } from "@/components/dev/DevSectionHeader";
import { DevStatusPill } from "@/components/dev/DevStatusPill";
import {
  formatDevDateTime,
  formatEtaSeconds,
} from "@/components/dev/dev-panel-formatters";

interface DevSyncQueueSectionProps {
  data: DevSyncStatusResponse | undefined;
  loading?: boolean;
}

interface OpsFeedback {
  kind: "success" | "error";
  message: string;
}

function resolveErrorMessage(caught: unknown, fallback: string): string {
  return caught instanceof ApiClientError ? caught.message : fallback;
}

function OpsBar() {
  const tickMutation = useDevOrchestratorTick();
  const emailMutation = useDevAccountEmailsCron();
  const [feedback, setFeedback] = useState<OpsFeedback | null>(null);

  const pending = tickMutation.isPending || emailMutation.isPending;

  async function runTick() {
    setFeedback(null);
    try {
      const result = await tickMutation.mutateAsync();
      setFeedback({ kind: "success", message: result.message });
    } catch (caught) {
      setFeedback({
        kind: "error",
        message: resolveErrorMessage(caught, "Falha ao rodar o tick."),
      });
    }
  }

  async function runEmails() {
    setFeedback(null);
    try {
      const result = await emailMutation.mutateAsync();
      setFeedback({ kind: "success", message: result.message });
    } catch (caught) {
      setFeedback({
        kind: "error",
        message: resolveErrorMessage(caught, "Falha ao rodar o cron de e-mails."),
      });
    }
  }

  return (
    <div className="dev-ops-bar">
      <div className="dev-ops-bar-head">
        <h3 className="dev-sync-queue-subtitle">Ações rápidas</h3>
        <p className="dev-ops-bar-hint">
          Dispare manualmente o orquestrador ou a fila de e-mails de conta.
        </p>
      </div>
      <div className="dev-ops-actions">
        <button
          type="button"
          className="btn-gold dev-action-btn"
          disabled={pending}
          onClick={() => void runTick()}
        >
          {tickMutation.isPending ? "Rodando…" : "Rodar tick agora"}
        </button>
        <button
          type="button"
          className="btn-outline dev-action-btn"
          disabled={pending}
          onClick={() => void runEmails()}
        >
          {emailMutation.isPending ? "Rodando…" : "Rodar cron de e-mails"}
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

function FailedJobsTable({ jobs }: { jobs: DevQueueJobView[] }) {
  const retryMutation = useDevRetrySyncJob();
  const [feedback, setFeedback] = useState<OpsFeedback | null>(null);

  async function retry(jobId: string) {
    setFeedback(null);
    try {
      const result = await retryMutation.mutateAsync(jobId);
      setFeedback({ kind: "success", message: result.message });
    } catch (caught) {
      setFeedback({
        kind: "error",
        message: resolveErrorMessage(caught, "Falha ao reprocessar o job."),
      });
    }
  }

  return (
    <div className="dev-sync-queue-block">
      <h3 className="dev-sync-queue-subtitle">Falhas recentes</h3>
      {jobs.length === 0 ? (
        <p className="dev-empty-state dev-empty-state--compact">
          Nenhuma falha recente.
        </p>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Conta</th>
                <th>Robô</th>
                <th>Erro</th>
                <th>Quando</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.jobId}>
                  <td>{job.cpfMasked}</td>
                  <td>{job.robot ?? job.mode}</td>
                  <td title={job.errorMessage ?? ""}>
                    <DevStatusPill tone="danger">
                      {job.errorCode ?? "erro"}
                    </DevStatusPill>
                  </td>
                  <td>
                    <time dateTime={job.finishedAt ?? job.createdAt}>
                      {formatDevDateTime(job.finishedAt ?? job.createdAt)}
                    </time>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-outline dev-action-btn dev-action-btn--sm"
                      disabled={retryMutation.isPending}
                      onClick={() => void retry(job.jobId)}
                    >
                      {retryMutation.isPending ? "…" : "Reprocessar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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

function triggerLabel(trigger: DevQueueJobView["trigger"]): string {
  if (trigger === "manual") return "Manual";
  if (trigger === "auto") return "Auto";
  if (trigger === "dev") return "Dev";
  return "Primeiro login";
}

function QueueTable({
  title,
  jobs,
  emptyMessage,
}: {
  title: string;
  jobs: DevQueueJobView[];
  emptyMessage: string;
}) {
  if (jobs.length === 0) {
    return (
      <div className="dev-sync-queue-block">
        <h3 className="dev-sync-queue-subtitle">{title}</h3>
        <p className="dev-empty-state dev-empty-state--compact">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="dev-sync-queue-block">
      <h3 className="dev-sync-queue-subtitle">{title}</h3>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Conta</th>
              <th>Modo</th>
              <th>Origem</th>
              <th>ETA</th>
              <th>Desde</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.jobId}>
                <td>{job.status === "queued" ? job.position + 1 : "▶"}</td>
                <td>{job.cpfMasked}</td>
                <td>{job.mode}</td>
                <td>{triggerLabel(job.trigger)}</td>
                <td>{formatEtaSeconds(job.etaSeconds)}</td>
                <td>
                  <time dateTime={job.createdAt}>
                    {formatDevDateTime(job.createdAt)}
                  </time>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrchestratorPlan({ actions }: { actions: DevOrchestratorPlanItem[] }) {
  if (actions.length === 0) {
    return (
      <p className="dev-empty-state dev-empty-state--compact">
        Nenhuma ação pendente no próximo tick do orquestrador.
      </p>
    );
  }

  return (
    <ol className="dev-orchestrator-list">
      {actions.map((action) => (
        <li key={`${action.order}-${action.label}`} className="dev-orchestrator-item">
          <span className="dev-orchestrator-order">{action.order}</span>
          <div>
            <span className="dev-orchestrator-label">{action.label}</span>
            <span className="dev-orchestrator-reason">{action.reason}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function DevSyncQueueSection({ data, loading }: DevSyncQueueSectionProps) {
  const summary = data?.orchestrator.policySummary;
  const windowLabel = data?.orchestrator.inNightlyWindow
    ? "Dentro da janela noturna"
    : "Fora da janela noturna";

  return (
    <section className="card col-12" aria-labelledby="dev-sync-queue-title">
      <DevSectionHeader
        icon="calendar"
        title="Fila de sync"
        titleId="dev-sync-queue-title"
        subtitle="Jobs enfileirados e ordem prevista do orquestrador B68e."
      />

      {loading ? (
        <p className="dev-empty-state" role="status">
          Carregando fila…
        </p>
      ) : (
        <>
          <div className="dev-sync-meta">
            <span>{windowLabel}</span>
            <span>
              Auto: {summary?.autoIntervalHours ?? "—"}h · max_concurrent:{" "}
              {summary?.workerMaxConcurrent ?? "—"}
            </span>
            <span>
              Último tick: {formatDevDateTime(data?.orchestrator.lastTickAt ?? null)}
            </span>
          </div>

          <OpsBar />

          <div className="dev-sync-queue-grid">
            <QueueTable
              title="Em execução"
              jobs={data?.queue.running ?? []}
              emptyMessage="Nenhum job rodando agora."
            />
            <QueueTable
              title="Na fila"
              jobs={data?.queue.queued ?? []}
              emptyMessage="Fila vazia — próximo sync entra ao disparar robô ou botão SIGAA."
            />
          </div>

          <FailedJobsTable jobs={data?.queue.failed ?? []} />

          <div className="dev-orchestrator-section">
            <h3 className="dev-sync-queue-subtitle">Próximo tick do orquestrador</h3>
            <OrchestratorPlan actions={data?.orchestrator.nextActions ?? []} />
          </div>
        </>
      )}
    </section>
  );
}
