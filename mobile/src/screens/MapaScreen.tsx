import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { MapaDisciplineStatus, MapaResponse } from "@acme/api-contracts";
import { ApiClientError } from "../auth/api";
import { fetchMapa } from "../cache/fetchers";
import { brand } from "../theme/brand";
import { cardStyles, StatCard } from "../ui/cards";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";

const STATUS_COLOR: Record<MapaDisciplineStatus, string> = {
  done: brand.success,
  current: brand.blue,
  unlocked: brand.gold,
  locked: brand.danger,
};

const STATUS_ORDER: MapaDisciplineStatus[] = [
  "done",
  "current",
  "unlocked",
  "locked",
];

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

  const donePct =
    data && data.stats.total > 0
      ? Math.round((data.stats.done / data.stats.total) * 100)
      : 0;

  return (
    <Screen
      title="Mapa PPC"
      subtitle={
        data ? `${data.curso} · ${donePct}% concluído` : undefined
      }
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

      {data ? (
        <>
          {!data.historicoSynced ? (
            <View style={cardStyles.card}>
              <Text style={cardStyles.cardMeta}>
                Histórico ainda não sincronizado — o mapa pode estar incompleto
                até o PDF do SIGAA ser importado.
              </Text>
            </View>
          ) : null}

          <View style={styles.statsGrid}>
            <StatCard label="Total" value={data.stats.total} />
            <StatCard
              label="Concluídas"
              value={data.stats.done}
              accent={brand.success}
            />
            <StatCard
              label="Cursando"
              value={data.stats.current}
              accent={brand.blue}
            />
            <StatCard
              label="Liberadas"
              value={data.stats.unlocked}
              accent={brand.gold}
            />
          </View>

          <View style={styles.legend}>
            {STATUS_ORDER.map((status) => (
              <View key={status} style={styles.legendItem}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: STATUS_COLOR[status] },
                  ]}
                />
                <Text style={styles.legendText}>
                  {data.statusLabels[status] ?? status}
                </Text>
              </View>
            ))}
          </View>

          {data.periods.length === 0 ? (
            <EmptyState title="Mapa vazio" message="Nenhum período encontrado." />
          ) : (
            data.periods.map((period) => (
              <View key={`p-${period.period}`} style={styles.periodBlock}>
                <Text style={styles.periodTitle}>
                  {period.period}º período
                </Text>
                {period.subjects.map((d, idx) => (
                  <View
                    key={`${d.code}-${idx}`}
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
                      <Text style={cardStyles.cardTitle}>
                        {d.shortLabel || d.name}
                      </Text>
                      <Text style={cardStyles.cardMeta}>
                        {d.name} · {d.ch}h
                        {d.blockedBy === "prereq"
                          ? " · pré-requisito"
                          : d.blockedBy === "ch"
                            ? ` · faltam ${d.chRemaining ?? "?"}h`
                            : ""}
                      </Text>
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
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
    color: brand.textMuted,
    fontWeight: "600",
  },
  periodBlock: {
    marginBottom: 16,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: brand.gold,
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
