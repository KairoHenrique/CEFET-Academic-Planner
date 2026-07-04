import type { TurmasOfertadasSyncResponse } from "@/lib/types/turmas-ofertadas-api";

export type TurmasSyncFeedbackTone = "success" | "warning" | "neutral";

export function resolveTurmasSyncFeedback(
  result: Pick<
    TurmasOfertadasSyncResponse,
    "message" | "partial" | "ok" | "skipped" | "usedExampleData"
  >
): { message: string; tone: TurmasSyncFeedbackTone } {
  const message = result.message.trim();

  if (result.usedExampleData || (result.partial && !result.ok)) {
    return { message, tone: "warning" };
  }

  if (result.partial) {
    return { message, tone: "warning" };
  }

  if (result.skipped) {
    return { message, tone: "neutral" };
  }

  if (result.ok) {
    return { message, tone: "success" };
  }

  return { message, tone: "warning" };
}
