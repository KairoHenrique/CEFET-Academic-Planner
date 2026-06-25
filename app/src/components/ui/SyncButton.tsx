"use client";

import { Icon } from "@/components/ui/Icon";
import { SyncProgress } from "@/components/ui/SyncProgress";
import { useSync } from "@/hooks/useSync";

export function SyncButton() {
  const sync = useSync();

  const handleClick = () => {
    sync.resetError();
    void sync.startSync();
  };

  return (
    <div className="navbar-sync-wrap">
      <button
        type="button"
        className="navbar-sync-btn"
        onClick={handleClick}
        disabled={sync.syncing}
        title="Sincronizar com SIGAA"
        aria-busy={sync.syncing}
      >
        <Icon
          name="sync"
          size={15}
          className={sync.syncing ? "sync-icon-spinning" : undefined}
        />
        <span>{sync.syncing ? "Sincronizando" : "Sync SIGAA"}</span>
      </button>

      {sync.syncing && (
        <div className="navbar-sync-progress" role="status" aria-live="polite">
          <SyncProgress progress={sync.progress} stepLabel={sync.stepLabel} />
        </div>
      )}

      {sync.error && !sync.syncing && (
        <p className="navbar-sync-error" role="alert">
          {sync.error}
        </p>
      )}
    </div>
  );
}
