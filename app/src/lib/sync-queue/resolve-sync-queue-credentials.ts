import { resolveSigaaPassword, resolveSigaaPasswordSync } from "@/lib/crypto/resolve-sigaa-password";

export async function resolveSyncQueuePassword(input: {
  username: string;
  password?: string;
}): Promise<string> {
  return resolveSigaaPassword(input);
}

/** @deprecated Prefer `resolveSyncQueuePassword` (async). Mantido para callers SQLite legados. */
export function resolveSyncQueuePasswordSync(input: {
  username: string;
  password?: string;
}): string {
  return resolveSigaaPasswordSync(input);
}
