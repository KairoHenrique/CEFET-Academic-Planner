import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY (ou PUBLISHABLE_KEY) ausente."
    );
  }
  return key;
}

function readServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente.");
  }
  return key;
}

let serverClient: SupabaseClient | null = null;

export function createServerSupabaseClient(): SupabaseClient {
  if (!serverClient) {
    serverClient = createClient(readSupabaseUrl(), readServiceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serverClient;
}

export function createBrowserSupabaseClient(): SupabaseClient {
  return createClient(readSupabaseUrl(), readSupabaseAnonKey(), {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

export function resetServerSupabaseClientForTests(): void {
  serverClient = null;
}
