import { notifyCpfDevices } from "@/lib/push/expo-push-send";
import { pgMarkPushFingerprintsSent } from "@/lib/push/push-sent-fingerprints-store";
import type { NotificationSnapshotItem } from "@/lib/types/notifications-api";

function pushCopyForItem(item: NotificationSnapshotItem): {
  title: string;
  body: string;
} {
  const body = item.subtitle?.trim() || item.title;
  switch (item.kind) {
    case "task":
      return { title: "Nova tarefa", body };
    case "grade":
      return { title: "Nova nota", body };
    case "task-reminder":
      return { title: item.title, body };
    case "calendar-event-reminder":
      return { title: item.title, body };
    case "class-reminder":
      return { title: item.title, body };
    case "integralizacao-alert":
      return { title: "Integralização", body };
    case "calendar-date-alert":
      return { title: "Data acadêmica", body };
    default:
      return { title: "ACME HUB", body };
  }
}

/**
 * Envia push só para fingerprints ainda não enviados.
 * Respeita a lista já filtrada por prefs (itens ativos).
 */
export async function pushNewNotificationItems(input: {
  userId: string;
  tokens: string[];
  items: NotificationSnapshotItem[];
  alreadySent: Set<string>;
}): Promise<number> {
  if (input.tokens.length === 0 || input.items.length === 0) return 0;

  const pending = input.items.filter(
    (item) => !input.alreadySent.has(item.fingerprint)
  );
  if (pending.length === 0) return 0;

  // Limita rajada (ex.: após sync grande) — prioritiza lembretes
  const ordered = [...pending].sort((a, b) => {
    const weight = (kind: string) =>
      kind.includes("reminder") || kind.includes("alert") ? 0 : 1;
    return weight(a.kind) - weight(b.kind);
  });
  const batch = ordered.slice(0, 8);

  for (const item of batch) {
    const copy = pushCopyForItem(item);
    await notifyCpfDevices({
      tokens: input.tokens,
      title: copy.title,
      body: copy.body,
      data: {
        type: item.kind,
        fingerprint: item.fingerprint,
      },
    });
  }

  await pgMarkPushFingerprintsSent(
    input.userId,
    batch.map((item) => item.fingerprint)
  );

  return batch.length;
}
