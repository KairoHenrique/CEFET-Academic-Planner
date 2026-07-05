import { unauthorizedError } from "@/lib/api/errors";
import { readDevOperatorSessionFromCookie } from "@/lib/dev-panel/operator-session";
import type { DevOperatorSession } from "@/lib/dev-panel/types";

export function requireDevOperator(request: Request): DevOperatorSession {
  const session = readDevOperatorSessionFromCookie(
    request.headers.get("cookie")
  );

  if (!session) {
    throw unauthorizedError("Sessão de operador inválida ou expirada.");
  }

  return session;
}
