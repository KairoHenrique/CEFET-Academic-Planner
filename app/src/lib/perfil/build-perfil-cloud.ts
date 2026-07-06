import { getAluno } from "@/lib/db/queries";
import { resolveSubscriptionAccessForCpf } from "@/lib/billing/access/resolve-subscription-access";
import type { AppProfileRecord } from "@/lib/auth/account/types";
import { getNotificationPreferences } from "@/lib/notifications/notification-preferences";
import { buildInitials } from "@/lib/perfil/build-initials";
import type { PerfilResponse, PerfilSubscription } from "@/lib/types/perfil-api";
import {
  getSyncAutoIntervalMinutes,
  getSyncLastAt,
} from "@/lib/sync/sync-preferences";

async function buildCloudSubscription(cpf: string): Promise<PerfilSubscription> {
  const access = await resolveSubscriptionAccessForCpf(cpf);

  return {
    planId: access.planId,
    planLabel: access.planLabel,
    status: access.status,
    expiresAt: access.expiresAt ?? new Date(0).toISOString(),
    daysRemaining: access.daysRemaining,
    renewHref: access.renewHref,
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
