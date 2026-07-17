import {
  accountExistsError,
  authUnavailableError,
  internalError,
  invalidCredentialsError,
} from "@/lib/api/errors";
import { assertCloudAccountAuthAvailable } from "@/lib/auth/account/cloud-auth-guard";
import { buildInternalAuthEmail } from "@/lib/auth/account/internal-auth-email";
import {
  deleteProfileByUserId,
  findProfileByCpf,
  findProfileByEmail,
  insertAppProfile,
} from "@/lib/auth/account/profile-repository";
import {
  createAnonSupabaseClient,
  mapSupabaseSession,
} from "@/lib/auth/account/supabase-auth-client";
import type {
  AccountAuthResult,
  LoginAccountInput,
  RegisterAccountInput,
} from "@/lib/auth/account/types";
import {
  ensureTrialRecordForCpf,
  resolveTrialSubscriptionForCpf,
} from "@/lib/auth/trial/trial-service";
import {
  resolveSubscriptionAccessForCpf,
  type ResolvedSubscriptionAccess,
} from "@/lib/billing/access/resolve-subscription-access";
import { persistServerSigaaCredentials, sealServerSigaaPassword } from "@/lib/crypto/server-sigaa-credential-store";
import { ensurePostgresReady } from "@/lib/db/bootstrap-postgres";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { enqueueWelcomeAccountEmail } from "@/lib/email/enqueue-account-email";
import { assertCredentialHardeningForRuntime } from "@/lib/security/credential-hardening";
import {
  enqueueCloudSyncJob,
  isCloudSyncWorkerConfigured,
} from "@/lib/sync-queue/cloud-sync-queue";

/**
 * Dispara o 1º sync de uma conta recém-criada (best-effort). O worker offline
 * não pode bloquear o cadastro — nesse caso o sync é reprocessado pelo
 * orquestrador (cron) ou por um sync manual. Idempotente: o enqueue r1 reusa
 * job ativo por usuário.
 */
async function enqueueInitialAccountSync(
  cpf: string,
  password: string
): Promise<void> {
  if (!isCloudSyncWorkerConfigured()) return;
  try {
    await enqueueCloudSyncJob({
      username: cpf,
      password,
      mode: "full",
      lane: "priority",
      trigger: "first_login",
    });
  } catch {
    // Silencioso: falha de dispatch não deve derrubar o fluxo de cadastro.
  }
}

async function resolveAccountSubscription(
  cpf: string
): Promise<ResolvedSubscriptionAccess> {
  // Garante o registro de trial (idempotente) para contas sem histórico…
  const existingTrial = await resolveTrialSubscriptionForCpf(cpf);
  if (!existingTrial) {
    await ensureTrialRecordForCpf(cpf);
  }
  // …mas retorna o acesso real: assinatura paga ativa tem precedência sobre trial.
  return resolveSubscriptionAccessForCpf(cpf);
}

async function signInWithInternalEmail(
  cpf: string,
  password: string
): Promise<AccountAuthResult> {
  const profile = await findProfileByCpf(cpf);
  if (!profile) {
    throw invalidCredentialsError("CPF ou senha incorretos.");
  }

  const authEmail = buildInternalAuthEmail(cpf);
  const supabase = createAnonSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password,
  });

  if (error || !data.session) {
    throw invalidCredentialsError("CPF ou senha incorretos.");
  }

  await persistServerSigaaCredentials(cpf, password).catch(() => undefined);
  const subscription = await resolveAccountSubscription(cpf);

  return {
    profile,
    session: mapSupabaseSession(data.session),
    subscription,
  };
}

export async function registerAccount(
  input: RegisterAccountInput
): Promise<AccountAuthResult> {
  assertCloudAccountAuthAvailable();
  assertCredentialHardeningForRuntime("cadastro cloud");
  await ensurePostgresReady();

  const existingCpf = await findProfileByCpf(input.cpf);
  if (existingCpf) {
    throw accountExistsError("Já existe uma conta com este CPF.");
  }

  const existingEmail = await findProfileByEmail(input.email);
  if (existingEmail) {
    throw accountExistsError("Já existe uma conta com este e-mail.");
  }

  const authEmail = buildInternalAuthEmail(input.cpf);
  const admin = createServerSupabaseClient();
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: authEmail,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        cpf: input.cpf,
        curso_id: input.cursoId,
        contact_email: input.email,
      },
    });

  if (createError || !created.user) {
    if (createError?.message?.toLowerCase().includes("already")) {
      throw accountExistsError("Já existe uma conta com este CPF.");
    }
    throw internalError("Não foi possível criar a conta.");
  }

  const userId = created.user.id;

  try {
    const profile = await insertAppProfile({
      userId,
      cpf: input.cpf,
      email: input.email,
      telefone: input.telefone,
      cursoId: input.cursoId,
      sigaaPasswordEnc: sealServerSigaaPassword(input.password),
      legalConsent: input.legalConsent,
    });

    await ensureTrialRecordForCpf(input.cpf);
    await enqueueWelcomeAccountEmail(profile).catch(() => undefined);
    const sessionResult = await signInWithInternalEmail(
      input.cpf,
      input.password
    );
    await enqueueInitialAccountSync(input.cpf, input.password);

    return {
      profile,
      session: sessionResult.session,
      subscription: sessionResult.subscription,
    };
  } catch (error) {
    await admin.auth.admin.deleteUser(userId);
    await deleteProfileByUserId(userId).catch(() => undefined);
    throw error;
  }
}

export async function loginAccount(
  input: LoginAccountInput
): Promise<AccountAuthResult> {
  assertCloudAccountAuthAvailable();
  assertCredentialHardeningForRuntime("login cloud");
  await ensurePostgresReady();
  return signInWithInternalEmail(input.cpf, input.password);
}

export function guardCloudAccountRoute(): void {
  try {
    assertCloudAccountAuthAvailable();
  } catch {
    throw authUnavailableError(
      "Cadastro/login cloud indisponível neste ambiente."
    );
  }
}
