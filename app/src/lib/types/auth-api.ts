import type {
  AppCursoId,
  AppProfileRecord,
  AuthSessionPayload,
} from "@/lib/auth/account/types";
import type { TrialSubscriptionSnapshot } from "@/lib/auth/trial/trial-status";

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
  subscription: TrialSubscriptionSnapshot;
}

export interface RegisterAccountBody {
  email: string;
  telefone: string;
  cpf: string;
  cursoId: AppCursoId;
  password: string;
}

export interface LoginAccountBody {
  cpf: string;
  password: string;
}
