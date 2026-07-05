import { validationError } from "@/lib/api/errors";
import type { AppProfileRecord } from "@/lib/auth/account/types";
import { updateProfileContact } from "@/lib/auth/account/profile-repository";
import { buildPerfilCloud } from "@/lib/perfil/build-perfil-cloud";
import {
  normalizeOptionalEmail,
  normalizeOptionalPhone,
} from "@/lib/perfil/normalize-contact-patch";
import { saveNotificationPreferences } from "@/lib/notifications/notification-preferences";
import type { PatchPerfilBody, PerfilResponse } from "@/lib/types/perfil-api";

export async function patchPerfilCloud(
  profile: AppProfileRecord,
  body: PatchPerfilBody
): Promise<PerfilResponse> {
  const hasAccountPatch = body.email !== undefined || body.phone !== undefined;
  const hasNotificationPatch = body.notifications !== undefined;

  if (!hasAccountPatch && !hasNotificationPatch) {
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
    saveNotificationPreferences(body.notifications);
  }

  return buildPerfilCloud(updatedProfile);
}
