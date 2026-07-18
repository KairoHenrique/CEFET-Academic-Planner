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
import {
  cardStyles,
  formatGrade,
  gradeRiskLabel,
} from "../ui/cards";
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
      {loading && items.length === 0 ? <LoadingBlock /> : null}
      {error && items.length === 0 ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : null}

      {items.length === 0 && !loading && !error ? (
        <EmptyState
          title="Nenhuma matéria"
          message="Sincronize seus dados com o SIGAA."
        />
      ) : null}

      {items.map((item) => (
        <Pressable
          key={item.code}
          style={({ pressed }) => [
            cardStyles.card,
            pressed && styles.pressed,
            { borderLeftColor: item.color, borderLeftWidth: 3 },
          ]}
          onPress={() =>
            navigation.navigate("DisciplinaDetail", {
              code: item.code,
              name: item.displayName,
            })
          }
        >
          <View style={cardStyles.row}>
            <Text style={[cardStyles.cardTitle, { flex: 1 }]}>
              {item.displayName}
            </Text>
            <Text style={styles.grade}>
              {formatGrade(item.grade, item.gradeMax)}
            </Text>
          </View>
          <Text style={cardStyles.cardMeta}>
            {item.code}
            {item.shortLabel ? ` · ${item.shortLabel}` : ""}
            {item.ch != null ? ` · ${item.ch}h` : ""}
          </Text>
          <Text style={cardStyles.cardMeta}>
            {gradeRiskLabel(item.gradeRisk)} · Faltas {item.absences}/
            {item.maxAbsences}
            {item.tasks > 0 ? ` · ${item.tasks} tarefa(s)` : ""}
          </Text>
          {item.professor ? (
            <Text style={cardStyles.cardMeta}>Prof. {item.professor}</Text>
          ) : null}
          {item.schedule ? (
            <Text style={cardStyles.cardMeta}>{item.schedule}</Text>
          ) : null}
          {item.room ? (
            <Text style={cardStyles.cardMeta}>Sala {item.room}</Text>
          ) : null}
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  grade: {
    fontSize: 16,
    fontWeight: "800",
    color: brand.gold,
  },
});
