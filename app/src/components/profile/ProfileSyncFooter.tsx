"use client";

import type { PerfilSyncStatus } from "@/lib/types/perfil-api";
import { formatDateTime } from "@/lib/perfil/format-profile-value";
import {
  formatQueueStatusHint,
  formatSyncIntervalLabel,
} from "@/lib/sync-queue/format-sync-queue-ui";
import { useSync } from "@/hooks/useSync";

interface ProfileSyncFooterProps {
  sync: PerfilSyncStatus;
}

export function ProfileSyncFooter({ sync }: ProfileSyncFooterProps) {
  const { syncing, activeJob } = useSync();
  const queueHint = formatQueueStatusHint(activeJob, syncing);
  const intervalLabel = formatSyncIntervalLabel(sync.intervalMinutes);

  return (
    <footer className="profile-sync-footer" aria-label="Status da sincronização">
      <span className="profile-sync-label">Último sync</span>
      <span className="profile-sync-value">
        {formatDateTime(sync.lastSyncAt)}
      </span>
      <span
        className={`profile-sync-hint${queueHint ? " profile-sync-hint--live" : ""}`}
        role={queueHint ? "status" : undefined}
        aria-live={queueHint ? "polite" : undefined}
      >
        {queueHint ??
          `Atualiza automaticamente a cada ${intervalLabel}`}
      </span>
    </footer>
  );
}
