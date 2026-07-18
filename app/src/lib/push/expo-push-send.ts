/**
 * Envia notificação via Expo Push API (M6).
 * Sem PII no payload — só título/corpo genéricos.
 */

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default" | null;
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
    .map((to) => ({
      to,
      title: input.title,
      body: input.body,
      data: input.data,
      sound: "default" as const,
    }));

  await sendExpoPushMessages(messages);
}
