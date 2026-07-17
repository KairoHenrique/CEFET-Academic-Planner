"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { NotificationSnapshotItem } from "@/lib/types/notifications-api";

/** Banners de página reaproveitam os alertas B36/B37 já computados no servidor. */
const NEAR_COMPLETION_BAND = 80;
const MAX_BANNER_ITEMS = 3;

/** Faixa (50/80/100) codificada no fim do fingerprint `...|{band}`. */
function readIntegralizacaoBand(item: NotificationSnapshotItem): number {
  const raw = item.fingerprint.slice(item.fingerprint.lastIndexOf("|") + 1);
  const band = Number.parseInt(raw, 10);
  return Number.isFinite(band) ? band : 0;
}

function isCompleted(item: NotificationSnapshotItem): boolean {
  return readIntegralizacaoBand(item) >= 100;
}

function selectIntegralizacaoAlerts(
  items: NotificationSnapshotItem[]
): NotificationSnapshotItem[] {
  return items
    .filter(
      (item) =>
        item.kind === "integralizacao-alert" &&
        readIntegralizacaoBand(item) >= NEAR_COMPLETION_BAND
    )
    .sort((a, b) => readIntegralizacaoBand(b) - readIntegralizacaoBand(a))
    .slice(0, MAX_BANNER_ITEMS);
}

function selectCalendarAlerts(
  items: NotificationSnapshotItem[]
): NotificationSnapshotItem[] {
  return items
    .filter((item) => item.kind === "calendar-date-alert")
    .slice(0, MAX_BANNER_ITEMS);
}

export interface AlertBannersState {
  integralizacao: NotificationSnapshotItem[];
  calendar: NotificationSnapshotItem[];
  /** Alguma categoria de CH concluída (faixa 100%) — banner em tom "success". */
  integralizacaoHasCompleted: boolean;
  loading: boolean;
}

/**
 * Lê o snapshot de notificações do cache do React Query (mesma chave/queryFn do
 * sino → dedupe, sem fetch extra) e deriva os itens para os banners de página.
 * Ao contrário do sino, não aplica o baseline de "lido": o banner é persistente.
 */
export function useAlertBanners(): AlertBannersState {
  const query = useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: getNotifications,
    staleTime: 60_000,
    retry: 1,
  });

  const items = query.data?.items;

  return useMemo(() => {
    const source = items ?? [];
    const integralizacao = selectIntegralizacaoAlerts(source);
    return {
      integralizacao,
      calendar: selectCalendarAlerts(source),
      integralizacaoHasCompleted: integralizacao.some(isCompleted),
      loading: query.isLoading,
    };
  }, [items, query.isLoading]);
}
