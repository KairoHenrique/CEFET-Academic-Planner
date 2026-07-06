import { resolvePixGatewayConfig } from "./resolve-pix-gateway-config";

export interface PixGatewayStatusResponse {
  ok: true;
  gateway: ReturnType<typeof resolvePixGatewayConfig>["id"];
  mode: ReturnType<typeof resolvePixGatewayConfig>["mode"];
  configured: boolean;
  checkoutReady: boolean;
  providers: {
    mock: { available: true; note: string };
    mercadopago: { available: true; note: string };
    asaas: { available: false; note: string };
  };
}

export function buildPixGatewayStatusResponse(): PixGatewayStatusResponse {
  const config = resolvePixGatewayConfig();

  return {
    ok: true,
    gateway: config.id,
    mode: config.mode,
    configured: config.configured,
    checkoutReady: config.checkoutReady,
    providers: {
      mock: {
        available: true,
        note: "Dev local; PLANNER_PIX_MOCK_CHECKOUT=true habilita checkout simulado.",
      },
      mercadopago: {
        available: true,
        note: "Provider v1 recomendado — MERCADOPAGO_ACCESS_TOKEN (TEST- = sandbox).",
      },
      asaas: {
        available: false,
        note: "Reservado pós-go-live; adapter stub na v1.",
      },
    },
  };
}
