import { findProfileByUserId } from "@/lib/auth/account/profile-repository";
import type { AppProfileRecord } from "@/lib/auth/account/types";
import { createServerSupabaseClient } from "@/lib/supabase/client";

function readBearerToken(authorization: string | null): string | null {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

export async function resolveProfileFromAuthorization(
  authorization: string | null
): Promise<AppProfileRecord | null> {
  const token = readBearerToken(authorization);
  if (!token) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return findProfileByUserId(data.user.id);
}
