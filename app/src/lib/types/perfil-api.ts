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
  inGracePeriod?: boolean;
  renewalEligible?: boolean;
}

export interface PerfilSyncStatus {
  /** Sync automático é sempre ativo na plataforma. */
  automatic: true;
  intervalMinutes: number;
  lastSyncAt: string | null;
}

export interface NotificationPreferences {
  tasks: boolean;
  grades: boolean;
  taskReminders: boolean;
  /** Eventos manuais e marcos — 24h e 1h antes. */
  calendarReminders: boolean;
  /** Aulas da grade — apenas 30 min antes. */
  classReminders: boolean;
}

export interface PerfilResponse {
  profile: PerfilAluno | null;
  account: PerfilAccount;
  subscription: PerfilSubscription;
  sync: PerfilSyncStatus;
  notifications: NotificationPreferences;
}

export interface PatchPerfilBody {
  email?: string | null;
  phone?: string | null;
  notifications?: Partial<NotificationPreferences>;
}
