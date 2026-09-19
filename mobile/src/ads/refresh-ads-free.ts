import type { BillingAccountResponse } from "@acme/api-contracts";
import { requestJson } from "../auth/api";
import { writeAdsFreeCache } from "./ads-free-store";

export async function refreshAdsFreeFromServer(): Promise<boolean> {
  try {
    const account = await requestJson<BillingAccountResponse>(
      "/api/billing/account"
    );
    const active = Boolean(account.adsFree?.active);
    await writeAdsFreeCache({
      active,
      expiresAt: account.adsFree?.expiresAt ?? null,
    });
    return active;
  } catch {
    return false;
  }
}
