import type { SyncAutoIntervalMinutes } from "@/lib/sync/sync-preferences";

export interface PerfilAluno {
  matricula: string;
  nome: string;
  curso: string | null;
  email: string | null;
  semestreEntrada: string | null;
  status: string | null;
  initials: string;
}

export interface PerfilSyncSettings {
  autoEnabled: boolean;
  intervalMinutes: SyncAutoIntervalMinutes;
  minIntervalMinutes: number;
  lastSyncAt: string | null;
  nextAllowedAt: string | null;
  remainingSeconds: number;
  intervalOptions: readonly SyncAutoIntervalMinutes[];
}

export interface PerfilResponse {
  profile: PerfilAluno | null;
  sync: PerfilSyncSettings;
}

export interface PatchPerfilBody {
  syncAutoEnabled?: boolean;
  syncIntervalMinutes?: SyncAutoIntervalMinutes;
}
