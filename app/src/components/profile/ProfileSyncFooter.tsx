import type { PerfilSyncStatus } from "@/lib/types/perfil-api";
import { formatDateTime } from "@/lib/perfil/format-profile-value";

interface ProfileSyncFooterProps {
  sync: PerfilSyncStatus;
}

export function ProfileSyncFooter({ sync }: ProfileSyncFooterProps) {
  return (
    <footer className="profile-sync-footer" aria-label="Status da sincronização">
      <span className="profile-sync-label">Último sync</span>
      <span className="profile-sync-value">
        {formatDateTime(sync.lastSyncAt)}
      </span>
      <span className="profile-sync-hint">
        Atualiza sozinho a cada {sync.intervalMinutes} min
      </span>
    </footer>
  );
}
