import { useCallback, useMemo, useState } from "react";
import { RefreshControl, TextInput, StyleSheet, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { SubjectListItem } from "@acme/api-contracts";
import { ApiClientError } from "../auth/api";
import { fetchDisciplinas } from "../cache/fetchers";
import { DisciplinaCard } from "../features/disciplinas/DisciplinaCard";
import {
  DISCIPLINA_FILTERS,
  subjectMatchesFilter,
  type DisciplinaFilterLabel,
} from "../lib/disciplina-filters";
import type { DisciplinasStackParamList } from "../navigation/types";
import { brand } from "../theme/brand";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";
import { SegmentTabs } from "../ui/SegmentTabs";

type Nav = NativeStackNavigationProp<
  DisciplinasStackParamList,
  "DisciplinasList"
>;

export function DisciplinasScreen() {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<SubjectListItem[]>([]);
  const [filter, setFilter] = useState<DisciplinaFilterLabel>("Todas");
  const [query, setQuery] = useState("");
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await fetchDisciplinas();
      setItems(result.data.items);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível carregar as matérias."
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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (!subjectMatchesFilter(item, filter)) return false;
      if (!q) return true;
      const hay = `${item.displayName} ${item.name} ${item.code} ${item.shortLabel}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, filter, query]);

  return (
    <Screen
      title="Matérias"
      subtitle="Notas, faltas, horários e tarefas"
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
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar matéria…"
        placeholderTextColor={brand.textMuted}
        style={styles.search}
      />

      <SegmentTabs
        tabs={DISCIPLINA_FILTERS.map((label) => ({ id: label, label }))}
        value={filter}
        onChange={setFilter}
      />

      {loading && items.length === 0 ? <LoadingBlock /> : null}
      {error && items.length === 0 ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : null}

      {visible.length === 0 && !loading && !error ? (
        <EmptyState
          title="Nenhuma matéria"
          message={
            items.length === 0
              ? "Sincronize seus dados com o SIGAA."
              : "Nenhum resultado para este filtro."
          }
        />
      ) : null}

      {visible.map((item, idx) => (
        <View key={`${item.code}-${idx}`}>
          <DisciplinaCard
            item={item}
            onPress={() =>
              navigation.navigate("DisciplinaDetail", {
                code: item.code,
                name: item.displayName,
              })
            }
          />
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: brand.glass,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: brand.text,
    fontSize: 15,
    marginBottom: 12,
  },
});
