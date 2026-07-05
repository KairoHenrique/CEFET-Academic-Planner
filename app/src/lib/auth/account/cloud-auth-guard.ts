import { isPostgresBackend } from "@/lib/db/backend/config";

export function assertCloudAccountAuthAvailable(): void {
  if (!isPostgresBackend()) {
    throw new Error(
      "Conta cloud indisponível no modo SQLite local. Use login SIGAA direto."
    );
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL ausente.");
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() &&
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  ) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY ausente.");
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente.");
  }
}

export function isCloudAccountAuthConfigured(): boolean {
  try {
    assertCloudAccountAuthAvailable();
    return true;
  } catch {
    return false;
  }
}
