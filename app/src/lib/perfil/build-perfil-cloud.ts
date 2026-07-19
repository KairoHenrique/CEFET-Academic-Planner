import {
  isCheckoutRenewalForUser,
  resolveSubscriptionAccessForCpf,
} from "@/lib/billing/access/resolve-subscription-access";
import type { AppProfileRecord } from "@/lib/auth/account/types";
import { buildInitials } from "@/lib/perfil/build-initials";
import {
  resolveCloudNotificationPreferences,
  resolveCloudPerfilAluno,
  resolveCloudSyncIntervalMinutes,
  resolveCloudSyncLastAt,
} from "@/lib/perfil/build-perfil-cloud-data";
import type { PerfilResponse, PerfilSubscription } from "@/lib/types/perfil-api";
import { pgGetSubjectPriorities } from "@/lib/priority/subject-priorities-store";
import { hasEncryptedPasswordByCpf } from "@/lib/auth/account/profile-repository";

export async function buildCloudSubscription(cpf: string): Promise<PerfilSubscription> {
  const access = await resolveSubscriptionAccessForCpf(cpf);
  const renewalEligible = await isCheckoutRenewalForUser(cpf);

  return {
    planId: access.planId,
    planLabel: access.planLabel,
    status: access.status,
    expiresAt: access.expiresAt ?? new Date(0).toISOString(),
    daysRemaining: access.daysRemaining,
    renewHref: access.renewHref,
    inGracePeriod: access.inGracePeriod,
    renewalEligible,
  };
}

export async function buildPerfilCloud(
  profile: AppProfileRecord
): Promise<PerfilResponse> {
  const aluno = await resolveCloudPerfilAluno();
  const subjectPriorities = await pgGetSubjectPriorities(profile.userId);

  return {
    profile: aluno
      ? {
          matricula: aluno.matricula,
          nome: aluno.nome,
          curso: aluno.curso,
          email: aluno.email,
          semestreEntrada: aluno.semestre_entrada,
          status: aluno.status,
          initials: buildInitials(aluno.nome),
        }
      : null,
    account: {
      cpf: profile.cpf,
      email: profile.email,
      phone: profile.telefone,
      sigaaAuthError: !(await hasEncryptedPasswordByCpf(profile.cpf)),
    },
    subscription: await buildCloudSubscription(profile.cpf),
    sync: {
      automatic: true,
      intervalMinutes: resolveCloudSyncIntervalMinutes(),
      lastSyncAt: resolveCloudSyncLastAt(),
    },
    notifications: await resolveCloudNotificationPreferences(profile.userId),
    subjectPriorities,
  };
}
