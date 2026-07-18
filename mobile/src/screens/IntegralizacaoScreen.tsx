import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { IntegralizacaoResponse } from "@acme/api-contracts";
import { ApiClientError } from "../auth/api";
import { fetchIntegralizacao } from "../cache/fetchers";
import { brand } from "../theme/brand";
import { cardStyles } from "../ui/cards";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";

export function IntegralizacaoScreen() {
  const [data, setData] = useState<IntegralizacaoResponse | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await fetchIntegralizacao();
      setData(result.data);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível carregar a integralização."
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
      title="Integralização"
      subtitle={
        data
          ? `${data.totalDone}h de ${data.totalHours}h · ${data.percent}%`
          : "Carga horária por categoria"
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
          <View style={[cardStyles.card, styles.summary]}>
            <Text style={styles.percent}>{data.percent}%</Text>
            <Text style={cardStyles.cardMeta}>
              {data.totalDone} horas cumpridas de {data.totalHours} horas totais
            </Text>
            <View style={styles.totalBarTrack}>
              <View
                style={[
                  styles.totalBarFill,
                  { width: `${Math.min(100, data.percent)}%` },
                ]}
              />
            </View>
          </View>

          {data.categories.length === 0 ? (
            <EmptyState title="Sem categorias" />
          ) : (
            data.categories.map((cat) => (
              <View key={cat.id} style={cardStyles.card}>
                <View style={cardStyles.row}>
                  <Text style={cardStyles.cardTitle}>{cat.label}</Text>
                  <Text style={styles.catPercent}>{cat.percent}%</Text>
                </View>
                <Text style={cardStyles.cardMeta}>
                  {cat.done}h / {cat.hours}h
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.min(100, cat.percent)}%` },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    alignItems: "center",
    marginBottom: 8,
  },
  percent: {
    fontSize: 36,
    fontWeight: "800",
    color: brand.gold,
  },
  totalBarTrack: {
    marginTop: 12,
    width: "100%",
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  totalBarFill: {
    height: "100%",
    backgroundColor: brand.gold,
    borderRadius: 999,
  },
  catPercent: {
    fontSize: 15,
    fontWeight: "800",
    color: brand.gold,
  },
  barTrack: {
    marginTop: 10,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: brand.gold,
    borderRadius: 999,
  },
});
