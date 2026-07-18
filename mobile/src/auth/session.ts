import type {
  AccountAuthResponse,
  AppCursoId,
  AuthSessionPayload,
  LoginAccountBody,
  RefreshAccountBody,
  RefreshAuthResponse,
  SubscriptionAccessView,
} from "@acme/api-contracts";

const SESSION_KEY = "acme-hub.auth.session";

/** Sessão cloud persistida no SecureStore. Senha nunca é gravada. */
export interface MobileAuthSession {
  mode: "cloud";
  userId: string;
  cpf: string;
  email: string;
  cursoId: AppCursoId;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
  loggedAt: string;
  /** Snapshot da assinatura (login / perfil) — gate M4. */
  subscription: SubscriptionAccessView;
}

export type SessionListener = (session: MobileAuthSession | null) => void;

let memorySession: MobileAuthSession | null = null;
const listeners = new Set<SessionListener>();

function notify(): void {
  for (const listener of listeners) {
    listener(memorySession);
  }
}

export function subscribeSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSession(): MobileAuthSession | null {
  return memorySession;
}

export function isAuthenticated(
  session: MobileAuthSession | null = memorySession
): boolean {
  return Boolean(session?.accessToken?.trim() && session.refreshToken?.trim());
}

export function buildAuthHeaders(
  session: MobileAuthSession | null = memorySession
): Record<string, string> {
  if (!session?.accessToken) return {};
  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.accessToken}`,
  };
  if (session.cpf) {
    headers["X-Planner-Sigaa-User"] = session.cpf;
  }
  return headers;
}

function toMobileSession(
  auth: AccountAuthResponse,
  loggedAt = new Date().toISOString()
): MobileAuthSession {
  return {
    mode: "cloud",
    userId: auth.profile.userId,
    cpf: auth.profile.cpf,
    email: auth.profile.email,
    cursoId: auth.profile.cursoId,
    accessToken: auth.session.accessToken,
    refreshToken: auth.session.refreshToken,
    expiresAt: auth.session.expiresAt,
    tokenType: auth.session.tokenType,
    loggedAt,
    subscription: auth.subscription,
  };
}

function applyTokenPayload(
  current: MobileAuthSession,
  session: AuthSessionPayload
): MobileAuthSession {
  return {
    ...current,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
    tokenType: session.tokenType,
  };
}

async function writeStore(session: MobileAuthSession | null): Promise<void> {
  const SecureStore = await import("expo-secure-store");
  if (!session) {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function setSession(session: MobileAuthSession): Promise<void> {
  memorySession = session;
  await writeStore(session);
  notify();
}

export async function clearSession(): Promise<void> {
  memorySession = null;
  await writeStore(null);
  notify();
}

export async function persistFromAuthResponse(
  auth: AccountAuthResponse
): Promise<MobileAuthSession> {
  const session = toMobileSession(auth);
  await setSession(session);
  return session;
}

export async function applySessionTokens(
  current: MobileAuthSession,
  tokens: AuthSessionPayload
): Promise<MobileAuthSession> {
  const next = applyTokenPayload(current, tokens);
  await setSession(next);
  return next;
}

export async function updateSubscription(
  subscription: SubscriptionAccessView
): Promise<MobileAuthSession | null> {
  const current = memorySession;
  if (!current) return null;
  const next = { ...current, subscription };
  await setSession(next);
  return next;
}

function hasSubscription(
  value: unknown
): value is SubscriptionAccessView {
  if (!value || typeof value !== "object") return false;
  const status = (value as SubscriptionAccessView).status;
  return typeof status === "string" && status.length > 0;
}

export async function hydrateSession(): Promise<MobileAuthSession | null> {
  try {
    const SecureStore = await import("expo-secure-store");
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) {
      memorySession = null;
      notify();
      return null;
    }
    const parsed = JSON.parse(raw) as MobileAuthSession;
    if (
      parsed?.mode !== "cloud" ||
      !parsed.accessToken?.trim() ||
      !parsed.refreshToken?.trim()
    ) {
      await clearSession();
      return null;
    }
    if (!hasSubscription(parsed.subscription)) {
      // Sessão antiga (M3): força sync de perfil no boot antes do gate.
      parsed.subscription = {
        planId: "",
        planLabel: "",
        status: "expired",
        expiresAt: "",
        daysRemaining: 0,
        renewHref: "/planos",
      };
    }
    memorySession = parsed;
    notify();
    return parsed;
  } catch {
    memorySession = null;
    notify();
    return null;
  }
}

export type { LoginAccountBody, RefreshAccountBody, RefreshAuthResponse };
