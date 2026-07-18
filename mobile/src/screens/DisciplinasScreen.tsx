import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { SubjectListItem } from "@acme/api-contracts";
import { ApiClientError } from "../auth/api";
import { fetchDisciplinas } from "../cache/fetchers";
import type { DisciplinasStackParamList } from "../navigation/types";
import { brand } from "../theme/brand";
import { cardStyles, formatGrade } from "../ui/cards";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";

type Nav = NativeStackNavigationProp<
  DisciplinasStackParamList,
  "DisciplinasList"
>;

export function DisciplinasScreen() {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<SubjectListItem[]>([]);
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

  function openDetail(item: SubjectListItem) {
    navigation.navigate("DisciplinaDetail", {
      code: item.code,
      name: item.displayName,
    });
  }

  return (
    <Screen
      title="Matérias"
      subtitle="Toque para ver notas, faltas e tarefas"
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
      {loading && items.length === 0 ? <LoadingBlock /> : null}
      {error && items.length === 0 ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : null}

      {items.length === 0 && !loading && !error ? (
        <EmptyState
          title="Nenhuma matéria"
          message="Sincronize seus dados no site ou aguarde a próxima sync."
        />
      ) : null}

      {items.map((item) => (
        <Pressable
          key={item.code}
          style={({ pressed }) => [
            cardStyles.card,
            styles.rowCard,
            pressed && styles.pressed,
            { borderLeftColor: item.color, borderLeftWidth: 4 },
          ]}
          onPress={() => openDetail(item)}
        >
          <View style={styles.main}>
            <Text style={cardStyles.cardTitle}>{item.displayName}</Text>
            <Text style={cardStyles.cardMeta}>
              {item.code}
              {item.professor ? ` · ${item.professor}` : ""}
            </Text>
            {item.schedule ? (
              <Text style={cardStyles.cardMeta}>{item.schedule}</Text>
            ) : null}
          </View>
          <View style={styles.side}>
            <Text style={styles.grade}>
              {formatGrade(item.grade, item.gradeMax)}
            </Text>
            <Text style={cardStyles.cardMeta}>
              Faltas {item.absences}/{item.maxAbsences}
            </Text>
            {item.tasks > 0 ? (
              <Text style={styles.tasks}>{item.tasks} tarefa(s)</Text>
            ) : null}
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  pressed: { opacity: 0.85 },
  main: { flex: 1 },
  side: { alignItems: "flex-end" },
  grade: {
    fontSize: 16,
    fontWeight: "800",
    color: brand.blue,
  },
  tasks: {
    marginTop: 4,
    fontSize: 11,
    color: brand.gold,
    fontWeight: "700",
  },
});
