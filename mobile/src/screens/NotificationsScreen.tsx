import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NotificationsSnapshotResponse } from "@acme/api-contracts";
import { ApiClientError } from "../auth/api";
import { fetchNotifications } from "../cache/fetchers";
import { mergeMobileNotificationItems } from "../features/notifications/merge-mobile-notification-items";
import { useOnSyncComplete } from "../sync/useOnSyncComplete";
import { brand } from "../theme/brand";
import { cardStyles, formatPtDate } from "../ui/cards";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";

const KIND_LABEL: Record<string, string> = {
  task: "Tarefa",
  grade: "Nota",
  "task-reminder": "Lembrete tarefa",
  "calendar-event-reminder": "Calendário",
  "class-reminder": "Aula",
  "integralizacao-alert": "Integralização",
  "calendar-date-alert": "Data acadêmica",
};

const REMINDER_TICK_MS = 60_000;

export function NotificationsScreen() {
  const [data, setData] = useState<NotificationsSnapshotResponse | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminderTick, setReminderTick] = useState(0);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await fetchNotifications();
      setData(result.data);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível carregar notificações."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load])
  );

  useOnSyncComplete(() => {
    void load(true);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setReminderTick((value) => value + 1);
    }, REMINDER_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const items = useMemo(() => {
    void reminderTick;
    if (!data) return [];
    return mergeMobileNotificationItems(data);
  }, [data, reminderTick]);

  return (
    <Screen
      title="Notificações"
      cacheHint={fromCache ? "Dados do cache offline" : null}
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={brand.gold}
          />
        ),
      }}
    >
      {loading && !data ? <LoadingBlock /> : null}
      {error && !data ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : null}

      {items.length === 0 && !loading ? (
        <EmptyState title="Nenhuma notificação" />
      ) : (
        items.map((item, idx) => (
          <View key={`${item.fingerprint}-${idx}`} style={cardStyles.card}>
            <View style={cardStyles.row}>
              <Text style={[cardStyles.cardTitle, { flex: 1 }]}>
                {item.title}
              </Text>
              <View style={cardStyles.badge}>
                <Text style={cardStyles.badgeText}>
                  {KIND_LABEL[item.kind] ?? item.kind}
                </Text>
              </View>
            </View>
            {item.subtitle ? (
              <Text style={cardStyles.cardMeta}>{item.subtitle}</Text>
            ) : null}
            {item.at ? (
              <Text style={cardStyles.cardMeta}>{formatPtDate(item.at)}</Text>
            ) : null}
            {item.notaObtida != null ? (
              <Text style={cardStyles.cardMeta}>
                Nota {item.notaObtida}
                {item.notaMaxima != null ? `/${item.notaMaxima}` : ""}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </Screen>
  );
}
