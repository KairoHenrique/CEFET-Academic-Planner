import { validationError } from "@/lib/api/errors";
import { saveAccountContact } from "@/lib/perfil/build-account";
import { buildPerfil } from "@/lib/perfil/build-perfil";
import { saveNotificationPreferences } from "@/lib/notifications/notification-preferences";
import type { PatchPerfilBody, PerfilResponse } from "@/lib/types/perfil-api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeOptionalEmail(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!EMAIL_PATTERN.test(trimmed)) {
    throw validationError("Informe um e-mail válido.");
  }
  return trimmed.toLowerCase();
}

function normalizeOptionalPhone(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length < 10 || digits.length > 11) {
    throw validationError("Informe um celular válido (10 ou 11 dígitos).");
  }
  return digits;
}

export function patchPerfil(body: PatchPerfilBody): PerfilResponse {
  const hasAccountPatch = body.email !== undefined || body.phone !== undefined;
  const hasNotificationPatch = body.notifications !== undefined;

  if (!hasAccountPatch && !hasNotificationPatch) {
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

  return buildPerfil();
}
