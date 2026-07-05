import { timingSafeEqual } from "node:crypto";

export interface DevOperatorCredential {
  email: string;
  password: string;
}

const PRIMARY_EMAIL_KEYS = ["EMAIL_DEV", "PLANNER_DEV_EMAIL"] as const;
const PRIMARY_PASSWORD_KEYS = ["PASSWORD_DEV", "PLANNER_DEV_PASSWORD"] as const;

function readEnv(key: string): string | null {
  const value = process.env[key]?.trim();
  return value ? value : null;
}

function safeEqualString(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

function pushPrimaryOperator(operators: DevOperatorCredential[]): void {
  const email =
    PRIMARY_EMAIL_KEYS.map((key) => readEnv(key)).find(Boolean) ?? null;
  const password =
    PRIMARY_PASSWORD_KEYS.map((key) => readEnv(key)).find(Boolean) ?? null;

  if (email && password) {
    operators.push({ email: email.toLowerCase(), password });
  }
}

function pushNumberedOperators(operators: DevOperatorCredential[]): void {
  for (let index = 2; index <= 10; index += 1) {
    const email = readEnv(`PLANNER_DEV_${index}_EMAIL`);
    const password = readEnv(`PLANNER_DEV_${index}_PASSWORD`);
    if (!email || !password) {
      continue;
    }
    operators.push({ email: email.toLowerCase(), password });
  }
}

export function listDevOperatorsFromEnv(): DevOperatorCredential[] {
  const operators: DevOperatorCredential[] = [];
  pushPrimaryOperator(operators);
  pushNumberedOperators(operators);

  const seen = new Set<string>();
  return operators.filter((operator) => {
    if (seen.has(operator.email)) {
      return false;
    }
    seen.add(operator.email);
    return true;
  });
}

export function verifyDevOperatorCredentials(input: {
  email: string;
  password: string;
}): DevOperatorCredential | null {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !password) {
    return null;
  }

  for (const operator of listDevOperatorsFromEnv()) {
    if (
      operator.email === email &&
      safeEqualString(operator.password, password)
    ) {
      return operator;
    }
  }

  return null;
}

export function assertDevOperatorsConfigured(): void {
  if (listDevOperatorsFromEnv().length === 0) {
    throw new Error(
      "Nenhum operador dev configurado (EMAIL_DEV/PASSWORD_DEV ou PLANNER_DEV_N_*)."
    );
  }
}
