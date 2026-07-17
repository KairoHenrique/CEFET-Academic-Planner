import { buildIntegralizacaoAlertFingerprint } from "@/lib/notifications/notification-fingerprint";
import type { IntegralizacaoResponse } from "@/lib/types/integralizacao-api";
import type { NotificationSnapshotItem } from "@/lib/types/notifications-api";

/**
 * B36 — marcos de integralização por categoria de CH.
 *
 * Regra de negócio (anti-spam + idempotência):
 * - Uma categoria só entra no sino ao cruzar uma faixa de conclusão.
 * - Emite-se apenas a MAIOR faixa cruzada (`50 → 80 → 100`), então há no
 *   máximo um item por categoria. Como a chave inclui a faixa, avançar de
 *   faixa gera um novo não-lido; re-syncs na mesma faixa são deduplicados
 *   pelo baseline client-side.
 */
const CATEGORY_MILESTONES = [50, 80, 100] as const;

/** Percentual concluído, limitado a 100 (a CH cumprida pode exceder a exigida). */
function resolveCategoryPercent(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

/** Maior marco já cruzado, ou `null` se ainda abaixo do primeiro. */
function resolveMilestoneBand(percent: number): number | null {
  let band: number | null = null;
  for (const milestone of CATEGORY_MILESTONES) {
    if (percent >= milestone) band = milestone;
  }
  return band;
}

function buildAlertItem(
  categoria: string,
  band: number,
  done: number,
  total: number,
  pending: number
): NotificationSnapshotItem {
  const isComplete = band >= 100;
  return {
    fingerprint: buildIntegralizacaoAlertFingerprint(categoria, band),
    kind: "integralizacao-alert",
    title: isComplete
      ? `CH ${categoria} concluída`
      : `${band}% da CH ${categoria}`,
    subtitle: isComplete
      ? `Você integralizou toda a carga de ${categoria.toLowerCase()} (${done}h de ${total}h).`
      : `${done}h de ${total}h — faltam ${pending}h.`,
    href: "/integralizacao",
    at: null,
  };
}

/** Núcleo puro — recebe a integralização já calculada (SQLite ou Postgres). */
export function buildIntegralizacaoAlertItems(
  integralizacao: IntegralizacaoResponse | null | undefined
): NotificationSnapshotItem[] {
  if (!integralizacao) return [];

  const items: NotificationSnapshotItem[] = [];
  for (const category of integralizacao.categories) {
    if (category.total <= 0) continue;

    const percent = resolveCategoryPercent(category.done, category.total);
    const band = resolveMilestoneBand(percent);
    if (band === null) continue;

    const pending = Math.max(0, category.pending);
    items.push(
      buildAlertItem(category.label, band, category.done, category.total, pending)
    );
  }

  return items;
}
