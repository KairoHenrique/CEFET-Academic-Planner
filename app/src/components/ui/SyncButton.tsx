"use client";

import { Icon } from "@/components/ui/Icon";
import { SyncProgress } from "@/components/ui/SyncProgress";
import { useSync } from "@/hooks/useSync";

interface SyncButtonProps {
  variant?: "navbar" | "dashboard";
}

export function SyncButton({ variant = "dashboard" }: SyncButtonProps) {
  const sync = useSync();

  const handleClick = () => {
    sync.resetError();
    void sync.startSync();
  };

  if (variant === "navbar") {
    return (
      <button
        type="button"
        className="navbar-sync-btn"
        onClick={handleClick}
        disabled={sync.syncing}
        title="Sincronizar com SIGAA"
      >
        <Icon
          name="sync"
          size={15}
          className={sync.syncing ? "sync-icon-spinning" : undefined}
        />
        <span>{sync.syncing ? "Sincronizando" : "Sync SIGAA"}</span>
      </button>
    );
  }

  return (
    <div className="dashboard-sync">
      <button
        type="button"
        className="btn-outline"
        onClick={handleClick}
        disabled={sync.syncing}
      >
        <Icon
          name="sync"
          size={14}
          className={sync.syncing ? "sync-icon-spinning" : undefined}
        />
        {sync.syncing ? "Sincronizando…" : "Re-sincronizar SIGAA"}
      </button>
      {sync.error && (
        <p className="dashboard-sync-error" role="alert">{sync.error}</p>
      )}
      {sync.syncing && (
        <SyncProgress progress={sync.progress} stepLabel={sync.stepLabel} />
      )}
    </div>
  );
}
