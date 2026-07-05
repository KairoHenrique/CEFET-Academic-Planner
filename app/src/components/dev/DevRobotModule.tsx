"use client";

import type { DevRobotTargetResult } from "@/lib/dev-panel/types";
import type { DevRobotDefinition } from "@/lib/dev-panel/robots/definitions";
import { DevRunResults } from "@/components/dev/DevRunResults";
import { Icon, type IconName } from "@/components/ui/Icon";

const ROBOT_ICONS: Record<DevRobotDefinition["id"], IconName> = {
  r1: "sync",
  r2: "calendar",
  r3: "books",
};

interface DevRobotModuleProps {
  definition: DevRobotDefinition;
  pending: boolean;
  results: DevRobotTargetResult[];
  error: string | null;
  canRunIndividual: boolean;
  onRunIndividual: () => void;
  onRunGlobal: () => void;
}

export function DevRobotModule({
  definition,
  pending,
  results,
  error,
  canRunIndividual,
  onRunIndividual,
  onRunGlobal,
}: DevRobotModuleProps) {
  const scopeLabel =
    definition.targetScope === "global" ? "Global" : "Por CPF";

  return (
    <article className="card dev-robot-module">
      <header className="dev-robot-module-head">
        <span className="section-header-icon" aria-hidden>
          <Icon name={ROBOT_ICONS[definition.id]} size={16} />
        </span>
        <div className="dev-robot-module-title-wrap">
          <h2 className="dev-robot-module-title">{definition.label}</h2>
          <p className="dev-robot-module-desc">{definition.description}</p>
        </div>
        <span className="dev-robot-scope-pill">{scopeLabel}</span>
      </header>

      <p className="dev-robot-module-endpoint">
        <code>{definition.endpoint}</code>
      </p>

      <div className="dev-robot-module-actions">
        {definition.supportsIndividual ? (
          <button
            type="button"
            className="btn-gold dev-action-btn"
            disabled={pending || !canRunIndividual}
            onClick={onRunIndividual}
          >
            Rodar conta
          </button>
        ) : null}
        {definition.supportsGlobal ? (
          <button
            type="button"
            className="btn-outline dev-action-btn"
            disabled={pending}
            onClick={onRunGlobal}
          >
            {definition.targetScope === "global" ? "Rodar global" : "Rodar todas"}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="form-error dev-run-error" role="alert">
          {error}
        </p>
      ) : null}

      <DevRunResults results={results} running={pending} />
    </article>
  );
}
