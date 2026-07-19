import { getAluno } from "@/lib/db/queries";
import { getNotificationPreferences } from "@/lib/notifications/notification-preferences";
import { buildPerfilAccount } from "@/lib/perfil/build-account";
import { buildInitials } from "@/lib/perfil/build-initials";
import { buildPerfilSubscription } from "@/lib/perfil/build-subscription-dev";
import type { PerfilResponse } from "@/lib/types/perfil-api";
import {
  getSyncAutoIntervalMinutes,
  getSyncLastAt,
} from "@/lib/sync/sync-preferences";
import { getSubjectPrioritiesFromStore } from "@/lib/priority/subject-priorities-store";

export function buildPerfil(): PerfilResponse {
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
    account: buildPerfilAccount(),
    subscription: buildPerfilSubscription(),
    sync: {
      automatic: true,
      intervalMinutes: getSyncAutoIntervalMinutes(),
      lastSyncAt: getSyncLastAt(),
    },
    notifications: getNotificationPreferences(),
    subjectPriorities: getSubjectPrioritiesFromStore(),
  };
}
