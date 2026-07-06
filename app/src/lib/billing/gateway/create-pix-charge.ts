import { getPixGateway } from "./get-pix-gateway";
import type { CreatePixChargeParams, PixChargeResult } from "./types";

export async function createPixCharge(
  params: CreatePixChargeParams
): Promise<PixChargeResult> {
  const gateway = getPixGateway();
  return gateway.createPixCharge(params);
}
