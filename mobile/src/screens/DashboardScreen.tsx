import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ApiClientError } from "../auth/api";
import { fetchDashboard } from "../cache/fetchers";
import type { DashboardResponse } from "@acme/api-contracts";
import { brand } from "../theme/brand";
import { cardStyles, formatPtDate, StatCard } from "../ui/cards";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";

export function DashboardScreen() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboard();
      setData(result.data);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível carregar o dashboard."
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

  const pendingTasks =
    data?.tarefas.filter((t) => !t.done).slice(0, 6) ?? [];

  return (
    <Screen
      title={`Olá, ${data?.aluno.nome.split(" ")[0] ?? "…"}`}
      subtitle={
        data
          ? `${data.aluno.curso} · ${data.aluno.semestreAtual}`
          : "Seu resumo acadêmico"
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
          <View style={styles.statsGrid}>
            <StatCard
              label="Integralização"
              value={`${data.stats.integralizacaoPercent}%`}
              accent={brand.gold}
            />
            <StatCard
              label="Matérias cursando"
              value={data.stats.disciplinasCursando}
            />
            <StatCard
              label="Tarefas pendentes"
              value={data.stats.tarefasPendentes}
            />
            <StatCard label="RG" value={data.stats.rg} />
          </View>

          <Text style={cardStyles.sectionTitle}>Próximas entregas</Text>
          {pendingTasks.length === 0 ? (
            <EmptyState
              title="Nenhuma tarefa pendente"
              message="Tudo em dia por aqui."
            />
          ) : (
            pendingTasks.map((task) => (
              <View key={task.id} style={cardStyles.card}>
                <View style={cardStyles.row}>
                  <Text style={cardStyles.cardTitle}>{task.title}</Text>
                  <View
                    style={[
                      cardStyles.badge,
                      { backgroundColor: `${task.subjectColor}22` },
                    ]}
                  >
                    <Text
                      style={[cardStyles.badgeText, { color: task.subjectColor }]}
                    >
                      {task.subject}
                    </Text>
                  </View>
                </View>
                <Text style={cardStyles.cardMeta}>
                  {formatPtDate(task.dueDateIso)}
                  {task.dueTime ? ` · ${task.dueTime}` : ""}
                  {task.type === "grupo" ? " · Grupo" : ""}
                </Text>
              </View>
            ))
          )}

          <Text style={cardStyles.sectionTitle}>Atalhos</Text>
          <View style={cardStyles.card}>
            <Text style={styles.hint}>
              Use as abas abaixo para navegar:{"\n"}•{" "}
              <Text style={styles.bold}>Agenda</Text> — calendário e datas
              acadêmicas{"\n"}• <Text style={styles.bold}>Matérias</Text> —
              notas, faltas e tarefas{"\n"}• <Text style={styles.bold}>Mais</Text>{" "}
              — mapa PPC, integralização, simulador, planos e perfil
            </Text>
          </View>

          {data.disciplinas.length > 0 ? (
            <>
              <Text style={cardStyles.sectionTitle}>Matérias em andamento</Text>
              {data.disciplinas.slice(0, 4).map((d) => (
                <View key={d.code} style={cardStyles.card}>
                  <Text style={cardStyles.cardTitle}>{d.displayName}</Text>
                  <Text style={cardStyles.cardMeta}>
                    Nota {d.grade ?? "—"}/{d.gradeMax} · Faltas {d.absences}/
                    {d.maxAbsences}
                  </Text>
                </View>
              ))}
            </>
          ) : null}
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
  hint: {
    fontSize: 14,
    color: brand.muted,
    lineHeight: 22,
  },
  bold: {
    fontWeight: "700",
    color: brand.navy,
  },
});
