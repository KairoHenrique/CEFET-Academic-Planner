import type { PerfilAluno } from "@/lib/types/perfil-api";

export interface PerfilSyncStatus {
  /** Sync automático é sempre ativo na plataforma. */
  automatic: true;
  intervalMinutes: number;
  minIntervalMinutes: number;
  lastSyncAt: string | null;
  nextAllowedAt: string | null;
  remainingSeconds: number;
}

export interface PerfilResponse {
  profile: PerfilAluno | null;
  sync: PerfilSyncStatus;
}
