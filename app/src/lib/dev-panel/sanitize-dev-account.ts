import { buildDevAccountRef } from "@/lib/dev-panel/dev-account-ref";
import type { DevAccountPublicView, DevAccountRecord } from "@/lib/dev-panel/types";

export function toDevAccountPublicView(
  account: DevAccountRecord
): DevAccountPublicView {
  return {
    accountRef: buildDevAccountRef({
      userId: account.userId,
      cpf: account.cpf,
    }),
    cpfMasked: account.cpfMasked,
    cpfLast4: account.cpfLast4,
    displayName: account.displayName,
    matricula: account.matricula,
    cursoId: account.cursoId,
    email: account.email,
    credentialSaved: account.credentialSaved,
    lastSyncAt: account.lastSyncAt,
    subscription: account.subscription,
  };
}

export function toDevAccountPublicViews(
  accounts: DevAccountRecord[]
): DevAccountPublicView[] {
  return accounts.map(toDevAccountPublicView);
}
