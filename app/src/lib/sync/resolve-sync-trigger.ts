import type { SyncJobTrigger } from "@/lib/sync-queue/types";
import type { SyncMode } from "@/lib/types/sync-pipeline";

export function resolveSyncTrigger(input: {
  trigger?: SyncJobTrigger;
  mode: SyncMode;
  canFastLogin: boolean;
}): SyncJobTrigger {
  if (
    input.trigger === "auto" ||
    input.trigger === "manual" ||
    input.trigger === "first_login" ||
    input.trigger === "dev"
  ) {
    return input.trigger;
  }

  if (!input.canFastLogin) {
    return "first_login";
  }

  return "manual";
}
