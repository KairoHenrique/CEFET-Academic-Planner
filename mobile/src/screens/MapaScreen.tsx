import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { MapaDisciplineStatus, MapaResponse } from "@acme/api-contracts";
import { ApiClientError } from "../auth/api";
import { fetchMapa } from "../cache/fetchers";
import { brand } from "../theme/brand";
import { cardStyles } from "../ui/cards";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";

const STATUS_COLOR: Record<MapaDisciplineStatus, string> = {
  concluida: "#3fb950",
  cursando: brand.blue,
  liberada: brand.gold,
  bloqueada: "#c45c5c",
  optativa: "#7b61a8",
};

export function MapaScreen() {
  const [data, setData] = useState<MapaResponse | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await fetchMapa();
      setData(result.data);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível carregar o mapa."
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

  return (
    <Screen
      title="Mapa PPC"
      subtitle={data ? `${data.curso} · ${data.stats.percent}% concluído` : undefined}
      cacheHint={fromCache ? "Dados do cache offline" : null}
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={brand.blue}
          />
        ),
      }}
    >
      {loading && !data ? <LoadingBlock /> : null}
      {error && !data ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : null}

      {data ? (
        <>
          <View style={styles.legend}>
            {(Object.keys(data.statusLabels) as MapaDisciplineStatus[]).map(
              (status) => (
                <View key={status} style={styles.legendItem}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: STATUS_COLOR[status] ?? brand.muted },
                    ]}
                  />
                  <Text style={styles.legendText}>
                    {data.statusLabels[status] ?? status}
                  </Text>
                </View>
              )
            )}
          </View>

          {data.periods.length === 0 ? (
            <EmptyState title="Mapa vazio" message="Nenhum período encontrado." />
          ) : (
            data.periods.map((period) => (
              <View key={period.period} style={styles.periodBlock}>
                <Text style={styles.periodTitle}>{period.label}</Text>
                {period.disciplines.map((d) => (
                  <View
                    key={d.code}
                    style={[
                      cardStyles.card,
                      styles.disciplineRow,
                      {
                        borderLeftColor: STATUS_COLOR[d.status],
                        borderLeftWidth: 4,
                      },
                    ]}
                  >
                    <View style={styles.disciplineMain}>
                      <Text style={cardStyles.cardTitle}>{d.name}</Text>
                      <Text style={cardStyles.cardMeta}>{d.code}</Text>
                    </View>
                    <View
                      style={[
                        cardStyles.badge,
                        {
                          backgroundColor: `${STATUS_COLOR[d.status]}22`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          cardStyles.badgeText,
                          { color: STATUS_COLOR[d.status] },
                        ]}
                      >
                        {data.statusLabels[d.status] ?? d.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: brand.muted,
    fontWeight: "600",
  },
  periodBlock: {
    marginBottom: 16,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: brand.navy,
    marginBottom: 8,
  },
  disciplineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  disciplineMain: {
    flex: 1,
  },
});
