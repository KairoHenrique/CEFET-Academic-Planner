import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
import { useSubjectPriorities } from "../lib/useSubjectPriorities";
import type { RootStackParamList } from "../navigation/types";
import { useOnSyncComplete } from "../sync/useOnSyncComplete";
import { brand } from "../theme/brand";
import { Card } from "../ui/cards";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBox } from "../ui/ErrorBox";
import { Icon } from "../ui/Icon";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Lista F28 — busca + FilterBar + cards com prioridade (`.subject-list-card`). */
export function DisciplinasScreen() {
  const navigation = useNavigation<Nav>();
  const { getPriority, setSubjectPriority, sortByPriority } =
    useSubjectPriorities();
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

  useOnSyncComplete(() => {
    void load(true);
  });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (!subjectMatchesFilter(item, filter)) return false;
      if (!q) return true;
      const hay =
        `${item.displayName} ${item.name} ${item.code} ${item.shortLabel}`.toLowerCase();
      return hay.includes(q);
    });
    return sortByPriority(filtered);
  }, [items, filter, query, sortByPriority]);

  const subtitle = loading
    ? "Carregando disciplinas do semestre..."
    : items.length > 0
      ? `${items.length} matérias cursando · notas, faltas e atividades`
      : "Sincronize com o SIGAA para ver suas disciplinas";

  return (
    <Screen
      title="Disciplinas"
      eyebrow="Semestre"
      subtitle={subtitle}
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
      <Card tight style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Icon name="search" size={16} color={brand.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar disciplina..."
            placeholderTextColor={brand.textMuted}
            style={styles.search}
            accessibilityLabel="Buscar disciplina"
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {DISCIPLINA_FILTERS.map((label) => {
            const active = label === filter;
            return (
              <Pressable
                key={label}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(label)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Card>

      {loading && items.length === 0 ? <LoadingBlock /> : null}
      {error && items.length === 0 ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : null}

      {visible.length === 0 && !loading && !error ? (
        <EmptyState
          title="Nenhuma disciplina encontrada"
          message={
            query || filter !== "Todas"
              ? "Ajuste a busca ou o filtro para ver outras matérias."
              : "Sincronize com o SIGAA para importar as disciplinas do semestre."
          }
        />
      ) : null}

      {visible.map((item, idx) => (
        <DisciplinaCard
          key={`${item.code}-${idx}`}
          item={item}
          priority={getPriority(item.code)}
          onChangePriority={(level) => setSubjectPriority(item.code, level)}
          onPress={() =>
            navigation.navigate("DisciplinaDetail", {
              code: item.code,
              name: item.displayName,
            })
          }
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    marginBottom: brand.space3,
    gap: brand.space3,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: brand.radiusMd,
    paddingHorizontal: 12,
    minHeight: brand.touchMin,
  },
  search: {
    flex: 1,
    color: brand.text,
    fontSize: 15,
    fontFamily: brand.fontBody,
    paddingVertical: 10,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  filterChipActive: {
    borderColor: brand.gold,
    backgroundColor: "rgba(232,198,106,0.14)",
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textMuted,
  },
  filterChipTextActive: {
    color: brand.gold200,
  },
});
