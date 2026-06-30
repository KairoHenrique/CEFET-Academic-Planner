export interface PerfilAluno {
  matricula: string;
  nome: string;
  curso: string | null;
  email: string | null;
  semestreEntrada: string | null;
  status: string | null;
  initials: string;
}
export interface PerfilSyncStatus {
  /** Sync automático é sempre ativo na plataforma. */
  automatic: true;
  intervalMinutes: number;
  lastSyncAt: string | null;
}

export interface PerfilResponse {
  profile: PerfilAluno | null;
  sync: PerfilSyncStatus;
}
