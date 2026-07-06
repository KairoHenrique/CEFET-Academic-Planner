import { ApiError } from "@/lib/api/errors";
import { createAsaasPixGateway } from "./asaas/asaas-pix-gateway";
import { createMercadoPagoPixGateway } from "./mercadopago/create-mercadopago-pix-charge";
import { mockPixGateway } from "./mock-pix-gateway";
import {
  resolvePixGatewayConfig,
  resolvePixGatewayId,
} from "./resolve-pix-gateway-config";
import type { PixGatewayProvider } from "./types";

export function getPixGateway(
  env: NodeJS.ProcessEnv = process.env
): PixGatewayProvider {
  const config = resolvePixGatewayConfig(env);

  if (config.id === "mock") {
    return mockPixGateway;
  }

  if (config.id === "mercadopago") {
    if (!config.configured) {
      throw new ApiError(
        "INTERNAL_ERROR",
        "Mercado Pago não configurado (MERCADOPAGO_ACCESS_TOKEN).",
        503
      );
    }

    return createMercadoPagoPixGateway(env.MERCADOPAGO_ACCESS_TOKEN ?? "");
  }

  if (config.id === "asaas") {
    if (!config.configured) {
      throw new ApiError(
        "INTERNAL_ERROR",
        "Asaas não configurado (ASAAS_API_KEY).",
        503
      );
    }

    return createAsaasPixGateway(env.ASAAS_API_KEY ?? "");
  }

  throw new ApiError(
    "INTERNAL_ERROR",
    `Gateway PIX desconhecido: ${resolvePixGatewayId(env)}`,
    500
  );
}
