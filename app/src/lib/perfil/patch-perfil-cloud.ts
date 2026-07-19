import { validationError } from "@/lib/api/errors";
import type { AppProfileRecord } from "@/lib/auth/account/types";
import { updateProfileContact } from "@/lib/auth/account/profile-repository";
import { buildPerfilCloud } from "@/lib/perfil/build-perfil-cloud";
import {
  normalizeOptionalEmail,
  normalizeOptionalPhone,
} from "@/lib/perfil/normalize-contact-patch";
import { pgMergeNotificationPreferences } from "@/lib/notifications/notification-preferences-store";
import { pgMergeSubjectPriorities } from "@/lib/priority/subject-priorities-store";
import type { PatchPerfilBody, PerfilResponse } from "@/lib/types/perfil-api";

export async function patchPerfilCloud(
  profile: AppProfileRecord,
  body: PatchPerfilBody
): Promise<PerfilResponse> {
  const hasAccountPatch = body.email !== undefined || body.phone !== undefined;
  const hasNotificationPatch = body.notifications !== undefined;
  const hasPriorityPatch = body.subjectPriorities !== undefined;

  if (!hasAccountPatch && !hasNotificationPatch && !hasPriorityPatch) {
    throw validationError("Nenhuma alteração informada.");
  }

  let updatedProfile = profile;

  if (hasAccountPatch) {
    updatedProfile = await updateProfileContact(profile.userId, {
      email:
        body.email !== undefined
          ? normalizeOptionalEmail(body.email)
          : undefined,
      telefone:
        body.phone !== undefined
          ? normalizeOptionalPhone(body.phone)
          : undefined,
    });
  }

  if (hasNotificationPatch && body.notifications) {
    await pgMergeNotificationPreferences(profile.userId, body.notifications);
  }

  if (hasPriorityPatch && body.subjectPriorities) {
    await pgMergeSubjectPriorities(profile.userId, body.subjectPriorities);
  }

  return buildPerfilCloud(updatedProfile);
}
