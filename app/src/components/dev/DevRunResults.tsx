"use client";

import type { DevRobotTargetResult } from "@/lib/dev-panel/types";

interface DevRunResultsProps {
  results: DevRobotTargetResult[];
  running?: boolean;
}

function statusLabel(status: DevRobotTargetResult["status"]): string {
  if (status === "ok") return "OK";
  if (status === "skipped") return "Ignorado";
  return "Falha";
}

export function DevRunResults({ results, running = false }: DevRunResultsProps) {
  if (running) {
    return (
      <div className="dev-run-results" role="status">
        <p className="panel-footer-note">Executando robôs selecionados…</p>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="dev-run-results" aria-live="polite">
      <h3 className="dev-run-results-title">Resultado da execução</h3>
      <ul className="dev-run-results-list">
        {results.map((item, index) => (
          <li
            key={`${item.robot}-${item.cpfMasked}-${index}`}
            className={`dev-run-result dev-run-result--${item.status}`}
          >
            <span className="dev-run-result-robot">{item.robot.toUpperCase()}</span>
            <span className="dev-run-result-target">{item.cpfMasked}</span>
            <span className="dev-run-result-status">{statusLabel(item.status)}</span>
            <span className="dev-run-result-message">{item.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
