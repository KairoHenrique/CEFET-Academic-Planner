import type { SyncRequest } from "@/lib/types/sync";

const SESSION_PROFILE_KEY = "academic-planner-sync-profile";
const PERSISTENT_PROFILE_KEY = "academic-planner-sync-profile-persist";

interface SyncProfile {
  username: string;
  rememberPassword: boolean;
}

function readProfile(raw: string | null): SyncProfile | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<SyncProfile & SyncRequest>;

    if (parsed.username && typeof parsed.username === "string") {
      return {
        username: parsed.username.trim(),
        rememberPassword: parsed.rememberPassword === true || parsed.savePassword === true,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function saveSyncCredentials(
  credentials: SyncRequest,
  persist: boolean
): void {
  if (typeof window === "undefined") return;

  const profile: SyncProfile = {
    username: credentials.username.trim(),
    rememberPassword: persist,
  };

  sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(profile));

  if (persist) {
    localStorage.setItem(PERSISTENT_PROFILE_KEY, JSON.stringify(profile));
  } else {
    localStorage.removeItem(PERSISTENT_PROFILE_KEY);
  }
}

export function getSyncCredentials(): SyncRequest | null {
  if (typeof window === "undefined") return null;

  const profile =
    readProfile(sessionStorage.getItem(SESSION_PROFILE_KEY)) ??
    readProfile(localStorage.getItem(PERSISTENT_PROFILE_KEY));

  if (!profile) return null;

  return {
    username: profile.username,
    password: "",
    savePassword: profile.rememberPassword,
  };
}

export function clearSyncCredentials(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_PROFILE_KEY);
  localStorage.removeItem(PERSISTENT_PROFILE_KEY);
}
