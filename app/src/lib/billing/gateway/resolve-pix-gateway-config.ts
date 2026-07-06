import type { PixGatewayConfig, PixGatewayId, PixGatewayMode } from "./types";

const VALID_GATEWAY_IDS: readonly PixGatewayId[] = [
  "mock",
  "mercadopago",
  "asaas",
] as const;

function normalizeGatewayId(raw: string | undefined): PixGatewayId {
  const value = raw?.trim().toLowerCase();

  if (value === "mercadopago" || value === "mp") {
    return "mercadopago";
  }

  if (value === "asaas") {
    return "asaas";
  }

  return "mock";
}

function isMercadoPagoSandboxToken(token: string): boolean {
  return token.startsWith("TEST-");
}

function resolveMercadoPagoConfig(token: string | undefined): PixGatewayConfig {
  const trimmed = token?.trim() ?? "";

  if (!trimmed) {
    return {
      id: "mercadopago",
      mode: "sandbox",
      configured: false,
      checkoutReady: false,
    };
  }

  const sandbox = isMercadoPagoSandboxToken(trimmed);

  return {
    id: "mercadopago",
    mode: sandbox ? "sandbox" : "production",
    configured: true,
    checkoutReady: true,
  };
}

function resolveAsaasConfig(apiKey: string | undefined): PixGatewayConfig {
  const trimmed = apiKey?.trim() ?? "";
  const env = process.env.ASAAS_ENV?.trim().toLowerCase();

  if (!trimmed) {
    return {
      id: "asaas",
      mode: "sandbox",
      configured: false,
      checkoutReady: false,
    };
  }

  return {
    id: "asaas",
    mode: env === "production" ? "production" : "sandbox",
    configured: true,
    checkoutReady: false,
  };
}

export function resolvePixGatewayId(
  env: NodeJS.ProcessEnv = process.env
): PixGatewayId {
  return normalizeGatewayId(env.PIX_GATEWAY);
}

export function resolvePixGatewayConfig(
  env: NodeJS.ProcessEnv = process.env
): PixGatewayConfig {
  const id = resolvePixGatewayId(env);

  if (id === "mercadopago") {
    return resolveMercadoPagoConfig(env.MERCADOPAGO_ACCESS_TOKEN);
  }

  if (id === "asaas") {
    return resolveAsaasConfig(env.ASAAS_API_KEY);
  }

  const mockCheckout =
    env.PLANNER_PIX_MOCK_CHECKOUT?.trim().toLowerCase() === "true";

  return {
    id: "mock",
    mode: "mock",
    configured: true,
    checkoutReady: mockCheckout,
  };
}

export function assertValidPixGatewayId(id: string): id is PixGatewayId {
  return VALID_GATEWAY_IDS.includes(id as PixGatewayId);
}
