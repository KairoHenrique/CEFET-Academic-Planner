import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { MapaDisciplineStatus, MapaResponse } from "@acme/api-contracts";
import { ApiClientError } from "../auth/api";
import { fetchMapaGrafo } from "../api/mutations";
import { fetchMapa } from "../cache/fetchers";
import { useOnSyncComplete } from "../sync/useOnSyncComplete";
import { brand } from "../theme/brand";
import { CourseMapGrafo } from "../ui/CourseMapGrafo";
import { cardStyles, StatCard } from "../ui/cards";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";
import { SegmentTabs } from "../ui/SegmentTabs";

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

type Tab = "grade" | "grafo";
type GrafoData = Awaited<ReturnType<typeof fetchMapaGrafo>>;

export function MapaScreen() {
  const [tab, setTab] = useState<Tab>("grade");
  const [data, setData] = useState<MapaResponse | null>(null);
  const [grafo, setGrafo] = useState<GrafoData | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [mapa, g] = await Promise.all([
        fetchMapa(),
        fetchMapaGrafo().catch(() => null),
      ]);
      setData(mapa.data);
      setFromCache(mapa.fromCache);
      if (g) setGrafo(g);
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

  useOnSyncComplete(() => {
    void load(true);
  });

  return (
    <Screen
      title="Mapa do Curso"
      eyebrow="Currículo"
      subtitle={data?.curso}
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
      <SegmentTabs
        tabs={[
          { id: "grade", label: "Grade" },
          { id: "grafo", label: "Grafo" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {loading && !data ? <LoadingBlock /> : null}
      {error && !data ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : null}

      {data && tab === "grade" ? (
        <>
          {!data.historicoSynced ? (
            <View style={cardStyles.card}>
              <Text style={cardStyles.cardMeta}>
                Histórico ainda não sincronizado — o mapa pode estar incompleto.
              </Text>
            </View>
          ) : null}

          <View style={styles.statsGrid}>
            <StatCard label="Total" value={data.stats.total} detail="disciplinas" tone="gold" />
            <StatCard
              label="Concluídas"
              value={data.stats.done}
              detail="feitas"
              tone="success"
            />
            <StatCard
              label="Cursando"
              value={data.stats.current}
              detail="agora"
              tone="blue"
            />
            <StatCard
              label="Liberadas"
              value={data.stats.unlocked}
              detail="disponíveis"
              tone="gold"
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
            <EmptyState title="Mapa vazio" />
          ) : (
            data.periods.map((period) => (
              <View key={`p-${period.period}`} style={styles.periodBlock}>
                <Text style={styles.periodTitle}>{period.period}º período</Text>
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
                      </Text>
                    </View>
                    <View
                      style={[
                        cardStyles.badge,
                        { backgroundColor: `${STATUS_COLOR[d.status]}22` },
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

      {tab === "grafo" ? (
        !grafo ? (
          <EmptyState
            title="Grafo indisponível"
            message="Puxe para atualizar."
          />
        ) : grafo.nodes.length === 0 ? (
          <EmptyState title="Grafo vazio" />
        ) : (
          <CourseMapGrafo
            nodes={grafo.nodes}
            edges={grafo.edges}
            statusLabels={grafo.statusLabels}
            layout={grafo.layout}
          />
        )
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
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: brand.textMuted, fontWeight: "600" },
  periodBlock: { marginBottom: 16 },
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
  disciplineMain: { flex: 1 },
});
