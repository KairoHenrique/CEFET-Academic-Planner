export interface PerfilAluno {
  matricula: string;
  nome: string;
  curso: string | null;
  email: string | null;
  semestreEntrada: string | null;
  status: string | null;
  initials: string;
}

export interface PerfilAccount {
  cpf: string | null;
  /** E-mail informado no cadastro da conta (não é o e-mail institucional do SIGAA). */
  email: string | null;
  phone: string | null;
}

export type PerfilSubscriptionStatus =
  | "trial_active"
  | "trial_expired"
  | "pending_payment"
  | "active"
  | "expired"
  | "cancelled";

export interface PerfilSubscription {
  planId: string;
  planLabel: string;
  status: PerfilSubscriptionStatus;
  expiresAt: string;
  daysRemaining: number;
  renewHref: string;
}

export interface PerfilSyncStatus {
  /** Sync automático é sempre ativo na plataforma. */
  automatic: true;
  intervalMinutes: number;
  lastSyncAt: string | null;
}

export interface PerfilResponse {
  profile: PerfilAluno | null;
  account: PerfilAccount;
  subscription: PerfilSubscription;
  sync: PerfilSyncStatus;
}
