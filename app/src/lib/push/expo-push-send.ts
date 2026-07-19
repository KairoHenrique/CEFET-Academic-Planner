/**
 * Envia notificação via Expo Push API (M6).
 * Sem PII no payload — só título/corpo genéricos.
 * channelId alinhado ao canal Android do APK (`acme-hub-default`).
 */

export const EXPO_PUSH_ANDROID_CHANNEL_ID = "acme-hub-default";

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default" | null;
  channelId?: string;
  priority?: "default" | "normal" | "high";
  ttl?: number;
}

export async function sendExpoPushMessages(
  messages: ExpoPushMessage[]
): Promise<void> {
  if (messages.length === 0) return;

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.warn(
      `[push] Expo Push HTTP ${response.status}: ${text.slice(0, 200)}`
    );
    return;
  }

  try {
    const payload = (await response.json()) as {
      data?: Array<{ status?: string; message?: string; details?: unknown }>;
    };
    const tickets = payload.data ?? [];
    for (const ticket of tickets) {
      if (ticket.status === "error") {
        console.warn(
          `[push] Ticket Expo erro: ${ticket.message ?? "desconhecido"}`
        );
      }
    }
  } catch {
    /* ignore parse */
  }
}

export async function notifyCpfDevices(input: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  const messages = input.tokens
    .filter((token) => token.startsWith("ExponentPushToken"))
    .map(
      (to): ExpoPushMessage => ({
        to,
        title: input.title,
        body: input.body,
        data: input.data,
        sound: "default",
        channelId: EXPO_PUSH_ANDROID_CHANNEL_ID,
        priority: "high",
        ttl: 60 * 60 * 24,
      })
    );

  await sendExpoPushMessages(messages);
}
