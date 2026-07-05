import { getAluno } from "@/lib/db/queries";
import { resolveTrialSubscriptionForCpf } from "@/lib/auth/trial/trial-service";
import { BILLING_RENEW_HREF } from "@/lib/auth/trial/constants";
import type { AppProfileRecord } from "@/lib/auth/account/types";
import { getNotificationPreferences } from "@/lib/notifications/notification-preferences";
import { buildInitials } from "@/lib/perfil/build-initials";
import type { PerfilResponse, PerfilSubscription } from "@/lib/types/perfil-api";
import {
  getSyncAutoIntervalMinutes,
  getSyncLastAt,
} from "@/lib/sync/sync-preferences";

async function buildCloudSubscription(cpf: string): Promise<PerfilSubscription> {
  const trial = await resolveTrialSubscriptionForCpf(cpf);
  if (trial) {
    return {
      planId: trial.planId,
      planLabel: trial.planLabel,
      status: trial.status,
      expiresAt: trial.expiresAt,
      daysRemaining: trial.daysRemaining,
      renewHref: trial.renewHref,
    };
  }

  return {
    planId: "trial",
    planLabel: "Trial gratuito",
    status: "trial_expired",
    expiresAt: new Date(0).toISOString(),
    daysRemaining: 0,
    renewHref: BILLING_RENEW_HREF,
  };
}

export async function buildPerfilCloud(
  profile: AppProfileRecord
): Promise<PerfilResponse> {
  const aluno = getAluno();

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
    },
    subscription: await buildCloudSubscription(profile.cpf),
    sync: {
      automatic: true,
      intervalMinutes: getSyncAutoIntervalMinutes(),
      lastSyncAt: getSyncLastAt(),
    },
    notifications: getNotificationPreferences(),
  };
}
