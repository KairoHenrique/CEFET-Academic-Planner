import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { SubjectDetailResponse } from "@acme/api-contracts";
import { ApiClientError, requestJson } from "../auth/api";
import type { DisciplinasStackParamList } from "../navigation/types";
import { brand } from "../theme/brand";
import {
  cardStyles,
  formatGrade,
  formatPtDate,
  gradeRiskLabel,
} from "../ui/cards";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";

type Route = RouteProp<DisciplinasStackParamList, "DisciplinaDetail">;

export function DisciplinaDetailScreen() {
  const { params } = useRoute<Route>();
  const [data, setData] = useState<SubjectDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await requestJson<SubjectDetailResponse>(
        `/api/disciplinas/${encodeURIComponent(params.code)}`
      );
      setData(result);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível carregar a matéria."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.code]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const subject = data?.subject;
  const tasks = data?.tasks ?? [];
  const att = data?.attendance;

  return (
    <Screen
      title={subject?.displayName ?? params.name ?? params.code}
      subtitle={
        subject
          ? `${subject.code}${subject.shortLabel ? ` · ${subject.shortLabel}` : ""}`
          : params.code
      }
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
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

      {subject && att ? (
        <>
          <View
            style={[
              cardStyles.card,
              { borderLeftColor: subject.color, borderLeftWidth: 3 },
            ]}
          >
            <Text style={cardStyles.sectionTitle}>Resumo</Text>
            {subject.nickname ? (
              <Text style={cardStyles.cardMeta}>
                Apelido: {subject.nickname}
              </Text>
            ) : null}
            <Text style={cardStyles.cardMeta}>
              Nota {formatGrade(subject.grade, subject.gradeMax)} (mín.{" "}
              {subject.passingGrade}) · {gradeRiskLabel(subject.gradeRisk)}
            </Text>
            <Text style={cardStyles.cardMeta}>
              Faltas {att.absences}/{att.maxAbsences} · {att.percentUsed}% ·{" "}
              {att.remaining} restantes
            </Text>
            {subject.ch != null ? (
              <Text style={cardStyles.cardMeta}>CH {subject.ch}h</Text>
            ) : null}
            {subject.professor ? (
              <Text style={cardStyles.cardMeta}>Prof. {subject.professor}</Text>
            ) : null}
            {subject.schedule ? (
              <Text style={cardStyles.cardMeta}>{subject.schedule}</Text>
            ) : null}
            {subject.room ? (
              <Text style={cardStyles.cardMeta}>Sala {subject.room}</Text>
            ) : null}
          </View>

          {subject.ementa ? (
            <>
              <Text style={cardStyles.sectionTitle}>Ementa</Text>
              <View style={cardStyles.card}>
                <Text style={cardStyles.cardMeta}>{subject.ementa}</Text>
              </View>
            </>
          ) : null}

          <Text style={cardStyles.sectionTitle}>Notas / avaliações</Text>
          {subject.evaluations.length === 0 ? (
            <EmptyState title="Sem avaliações registradas" />
          ) : (
            subject.evaluations.map((ev, idx) => (
              <View key={`${ev.name}-${idx}`} style={cardStyles.card}>
                <View style={cardStyles.row}>
                  <Text style={[cardStyles.cardTitle, { flex: 1 }]}>
                    {ev.name}
                    {ev.extra ? " (extra)" : ""}
                  </Text>
                  <Text style={styles.score}>
                    {ev.score != null ? ev.score.toFixed(1) : "—"}/{ev.max}
                  </Text>
                </View>
              </View>
            ))
          )}

          <Text style={cardStyles.sectionTitle}>Tarefas</Text>
          {tasks.length === 0 ? (
            <EmptyState title="Sem tarefas" />
          ) : (
            tasks.map((task) => (
              <View key={task.id} style={cardStyles.card}>
                <View style={cardStyles.row}>
                  <Text style={[cardStyles.cardTitle, { flex: 1 }]}>
                    {task.title}
                  </Text>
                  {task.done ? (
                    <Text style={styles.done}>Feita</Text>
                  ) : (
                    <Text style={styles.pending}>Pendente</Text>
                  )}
                </View>
                <Text style={cardStyles.cardMeta}>
                  {formatPtDate(task.dueDateIso)}
                  {task.dueTime ? ` · ${task.dueTime}` : ""}
                  {task.type === "grupo" ? " · Grupo" : " · Individual"}
                </Text>
                {task.description ? (
                  <Text style={cardStyles.cardMeta}>{task.description}</Text>
                ) : null}
              </View>
            ))
          )}

          {data!.grupo.membros.length > 0 ? (
            <>
              <Text style={cardStyles.sectionTitle}>
                Grupo{data!.grupo.nome ? ` · ${data!.grupo.nome}` : ""}
              </Text>
              <View style={cardStyles.card}>
                {data!.grupo.membros.map((m, i) => (
                  <Text
                    key={`${m.matricula ?? m.nome}-${i}`}
                    style={cardStyles.cardMeta}
                  >
                    {m.nome}
                    {m.matricula ? ` · ${m.matricula}` : ""}
                    {m.email ? ` · ${m.email}` : ""}
                  </Text>
                ))}
              </View>
            </>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  score: {
    fontSize: 15,
    fontWeight: "800",
    color: brand.gold,
  },
  done: {
    color: brand.success,
    fontWeight: "700",
    fontSize: 12,
  },
  pending: {
    color: brand.gold,
    fontWeight: "700",
    fontSize: 12,
  },
});
