import type {
  AppCursoId,
  AppProfileRecord,
  AuthSessionPayload,
} from "@/lib/auth/account/types";
import type { ResolvedSubscriptionAccess } from "@/lib/billing/access/resolve-subscription-access";

export interface AuthCursoOption {
  id: AppCursoId;
  label: string;
}

export interface AuthConfigResponse {
  ok: true;
  mode: "cloud" | "sigaa";
  cursos: AuthCursoOption[];
}

export interface AccountAuthResponse {
  ok: true;
  profile: AppProfileRecord;
  session: AuthSessionPayload;
  subscription: ResolvedSubscriptionAccess;
}

export interface RegisterAccountBody {
  email: string;
  telefone: string;
  cpf: string;
  cursoId: AppCursoId;
  password: string;
  acceptedLegal: {
    terms: boolean;
    privacy: boolean;
    termsVersion: string;
    privacyVersion: string;
  };
}

export interface LoginAccountBody {
  cpf: string;
  password: string;
}
