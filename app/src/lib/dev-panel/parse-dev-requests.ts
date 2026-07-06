import { validationError } from "@/lib/api/errors";
import type {
  DevRobotRunRequest,
  DevRobotsSelection,
} from "@/lib/dev-panel/types";
import type { SyncPolicyOverrides } from "@/lib/sync-policy/types";

function parseRobots(value: unknown): DevRobotsSelection {
  if (!value || typeof value !== "object") {
    throw validationError("Campo robots é obrigatório.");
  }

  const record = value as Record<string, unknown>;
  const selection: DevRobotsSelection = {
    r1: record.r1 === true,
    r2: record.r2 === true,
    r3: record.r3 === true,
  };

  if (!selection.r1 && !selection.r2 && !selection.r3) {
    throw validationError("Selecione ao menos um robô (R1, R2 ou R3).");
  }

  return selection;
}

export function parseDevRobotRunRequest(body: unknown): DevRobotRunRequest {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;
  const scope = record.scope;
  if (scope !== "individual" && scope !== "global") {
    throw validationError('Campo scope deve ser "individual" ou "global".');
  }

  const accountRef =
    typeof record.accountRef === "string" ? record.accountRef.trim() : undefined;
  if (scope === "individual" && !accountRef) {
    throw validationError(
      "Informe accountRef válido para escopo individual."
    );
  }

  const modeRaw = record.mode;
  const mode =
    modeRaw === "full" || modeRaw === "lite" || modeRaw === "deep"
      ? modeRaw
      : "deep";

  return {
    scope,
    accountRef,
    robots: parseRobots(record.robots),
    mode,
  };
}

export function parseDevLoginRequest(body: unknown): {
  email: string;
  password: string;
} {
  if (!body || typeof body !== "object") {
    throw validationError("Corpo da requisição inválido.");
  }

  const record = body as Record<string, unknown>;
  const email = typeof record.email === "string" ? record.email.trim() : "";
  const password = typeof record.password === "string" ? record.password : "";

  if (!email || !password) {
    throw validationError("Informe e-mail e senha do operador.");
  }

  return { email, password };
}

export function parseSyncPolicyPatchBody(body: unknown): SyncPolicyOverrides {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw validationError("Policy deve ser um objeto JSON.");
  }

  return body as SyncPolicyOverrides;
}
