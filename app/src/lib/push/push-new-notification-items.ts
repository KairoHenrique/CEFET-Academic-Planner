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
      return { title: "📝 Nova Tarefa", body };
    case "grade":
      if (body.includes("Parabéns, você passou!")) {
        return { title: "🎉 Aprovado!", body };
      }
      return { title: "💯 Nova Nota", body };
    case "task-reminder":
      return { title: item.title, body };
    case "calendar-event-reminder":
      return { title: item.title, body };
    case "class-reminder":
      return { title: item.title, body };
    case "integralizacao-alert":
      return { 
        title: "🏆 ACME HUB", 
        body: "Acompanhe de perto seu progresso rumo à formatura com nossos relatórios detalhados!" 
      };
    case "absence":
      return { title: "🛑 Atenção às Faltas", body };
    case "calendar-date-alert":
      return { title: "🏛️ Data Acadêmica", body };
    case "grade-risk":
      return { title: "🚨 Risco de Reprovação", body };
    case "task-late":
      return { title: "⚠️ Tarefa Atrasada", body };
    case "absence-failed":
      return { title: "💔 Limite de Faltas Excedido", body };
    case "morning-summary":
      return { title: "☕ Bom dia! Suas aulas hoje", body };
    case "graduation-alert":
      return { title: "🎓 Você está quase lá!", body };
    case "plan-expiring":
      return { title: "⏳ Seu plano está acabando", body };
    case "promo":
      return { title: "🎁 Presente pra você!", body };
    case "subscription-renewed":
      return { title: "💎 Assinatura Renovada!", body };
    case "invalid-password":
      return { title: "⚠️ Falha na Sincronização", body };
    case "app-updated":
      return { title: "🚀 Nova Versão Disponível", body };
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
