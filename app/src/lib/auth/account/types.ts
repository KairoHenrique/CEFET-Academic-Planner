import type { ResolvedSubscriptionAccess } from "@/lib/billing/access/resolve-subscription-access";

export type AppCursoId =
  | "eng-computacao"
  | "eng-mecatronica"
  | "design-moda";

export interface AppProfileRecord {
  userId: string;
  cpf: string;
  email: string;
  telefone: string;
  cursoId: AppCursoId;
  createdAt: string;
}

export interface RegisterAccountInput {
  email: string;
  telefone: string;
  cpf: string;
  cursoId: AppCursoId;
  password: string;
  /** Matrícula SIGAA do amigo (opcional) — indicação B74. */
  friendMatricula?: string;
  legalConsent: {
    termsVersion: string;
    privacyVersion: string;
  };
}

export interface LoginAccountInput {
  cpf: string;
  password: string;
}

export interface AuthSessionPayload {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

export interface AccountAuthResult {
  profile: AppProfileRecord;
  session: AuthSessionPayload;
  subscription: ResolvedSubscriptionAccess;
}
