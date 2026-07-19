export const ACCOUNT_EMAIL_KINDS = [
  "promotion",
  "welcome",
  "trial_ended",
  "plan_expiring_soon",
  "plan_ended",
  "support_notify",
] as const;

export type AccountEmailKind = (typeof ACCOUNT_EMAIL_KINDS)[number];

export interface AccountEmailEnqueueInput {
  userId?: string | null;
  cpf: string;
  toEmail: string;
  kind: AccountEmailKind;
  dedupeKey: string;
  subject: string;
  bodyText: string;
  scheduledFor?: Date;
}

export interface AccountEmailQueueRow {
  id: string;
  userId: string | null;
  cpf: string;
  toEmail: string;
  kind: AccountEmailKind;
  dedupeKey: string;
  subject: string;
  bodyText: string;
  status: "pending" | "processing" | "sent" | "failed";
  scheduledFor: string;
  attempts: number;
  lastError: string | null;
  sentAt: string | null;
  createdAt: string;
}
