import { validationError } from "@/lib/api/errors";
import { saveAccountContact } from "@/lib/perfil/build-account";
import { buildPerfil } from "@/lib/perfil/build-perfil";
import {
  normalizeOptionalEmail,
  normalizeOptionalPhone,
} from "@/lib/perfil/normalize-contact-patch";
import { saveNotificationPreferences } from "@/lib/notifications/notification-preferences";
import {
  mergeSubjectPrioritiesToStore,
} from "@/lib/priority/subject-priorities-store";
import type { PatchPerfilBody, PerfilResponse } from "@/lib/types/perfil-api";

export function patchPerfil(body: PatchPerfilBody): PerfilResponse {
  const hasAccountPatch = body.email !== undefined || body.phone !== undefined;
  const hasNotificationPatch = body.notifications !== undefined;
  const hasPriorityPatch = body.subjectPriorities !== undefined;

  if (!hasAccountPatch && !hasNotificationPatch && !hasPriorityPatch) {
    throw validationError("Nenhuma alteração informada.");
  }

  if (hasAccountPatch) {
    saveAccountContact({
      email:
        body.email !== undefined
          ? normalizeOptionalEmail(body.email)
          : undefined,
      phone:
        body.phone !== undefined
          ? normalizeOptionalPhone(body.phone)
          : undefined,
    });
  }

  if (hasNotificationPatch && body.notifications) {
    saveNotificationPreferences(body.notifications);
  }

  if (hasPriorityPatch && body.subjectPriorities) {
    mergeSubjectPrioritiesToStore(body.subjectPriorities);
  }

  return buildPerfil();
}
