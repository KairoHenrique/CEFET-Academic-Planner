import type { Session } from "@supabase/supabase-js";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthSessionPayload } from "@/lib/auth/account/types";

function readSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL ausente.");
  }
  return url;
}

function readSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY ausente.");
  }
  return key;
}

let anonClient: SupabaseClient | null = null;

export function createAnonSupabaseClient(): SupabaseClient {
  if (!anonClient) {
    anonClient = createClient(readSupabaseUrl(), readSupabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return anonClient;
}

export function mapSupabaseSession(session: Session): AuthSessionPayload {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? 0,
    tokenType: session.token_type,
  };
}

export function resetAnonSupabaseClientForTests(): void {
  anonClient = null;
}
