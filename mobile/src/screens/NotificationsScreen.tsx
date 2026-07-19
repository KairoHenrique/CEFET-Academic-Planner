import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NotificationsSnapshotResponse } from "@acme/api-contracts";
import { ApiClientError } from "../auth/api";
import { fetchNotifications } from "../cache/fetchers";
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

export function NotificationsScreen() {
  const [data, setData] = useState<NotificationsSnapshotResponse | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const items = data?.items ?? [];

  return (
    <Screen
      title="Notificações"
      subtitle="Mesmo feed do sino do site"
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

      {data ? (
        <Text style={styles.footer}>
          Capturado em {new Date(data.capturedAt).toLocaleString("pt-BR")}
        </Text>
      ) : null}
      {refreshing ? (
        <ActivityIndicator color={brand.gold} style={{ marginTop: 8 }} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: 12,
    fontSize: 12,
    color: brand.textMuted,
    textAlign: "center",
  },
});
