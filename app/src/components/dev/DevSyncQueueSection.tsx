"use client";

import type {
  DevOrchestratorPlanItem,
  DevQueueJobView,
  DevSyncStatusResponse,
} from "@/lib/dev-panel/types";
import { DevSectionHeader } from "@/components/dev/DevSectionHeader";
import {
  formatDevDateTime,
  formatEtaSeconds,
} from "@/components/dev/dev-panel-formatters";

interface DevSyncQueueSectionProps {
  data: DevSyncStatusResponse | undefined;
  loading?: boolean;
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

          <div className="dev-orchestrator-section">
            <h3 className="dev-sync-queue-subtitle">Próximo tick do orquestrador</h3>
            <OrchestratorPlan actions={data?.orchestrator.nextActions ?? []} />
          </div>
        </>
      )}
    </section>
  );
}
