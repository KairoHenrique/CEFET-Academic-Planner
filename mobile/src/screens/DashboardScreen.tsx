import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type {
  DashboardResponse,
  ScheduleApiResponse,
} from "@acme/api-contracts";
import { ApiClientError } from "../auth/api";
import { fetchDashboard, fetchSchedule } from "../cache/fetchers";
import { brand } from "../theme/brand";
import {
  cardStyles,
  formatGrade,
  formatPtDate,
  gradeRiskLabel,
  StatCard,
} from "../ui/cards";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";
import { WeeklyScheduleGrid } from "../ui/WeeklyScheduleGrid";

export function DashboardScreen() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [schedule, setSchedule] = useState<ScheduleApiResponse | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [dash, sched] = await Promise.all([
        fetchDashboard(),
        fetchSchedule().catch(() => null),
      ]);
      setData(dash.data);
      setFromCache(dash.fromCache || Boolean(sched?.fromCache));
      if (sched) setSchedule(sched.data);
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

  const pendingTasks = data?.tarefas.filter((t) => !t.done).slice(0, 8) ?? [];
  const integ = data?.integralizacao;

  return (
    <Screen
      title={data ? `Olá, ${data.aluno.nome.split(" ")[0]}` : "Início"}
      subtitle={
        data
          ? `${data.aluno.curso} · ${data.aluno.semestreAtual} · mat. ${data.aluno.matricula}`
          : "Resumo acadêmico"
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
          <View style={styles.statsGrid}>
            <StatCard
              key="stat-integ"
              label="Integralização"
              value={`${data.stats.integralizacaoPercent}%`}
              accent={brand.gold}
            />
            <StatCard
              key="stat-cursando"
              label="Cursando"
              value={data.stats.disciplinasCursando}
            />
            <StatCard
              key="stat-tarefas"
              label="Tarefas"
              value={data.stats.tarefasPendentes}
            />
            <StatCard key="stat-rg" label="RG" value={data.stats.rg} />
          </View>

          {integ ? (
            <>
              <Text style={cardStyles.sectionTitle}>Integralização (CH)</Text>
              <View style={cardStyles.card}>
                <Text style={cardStyles.cardTitle}>
                  {integ.totalDone}/{integ.totalHours}h · {integ.percent}%
                </Text>
                {integ.categories.map((cat, idx) => (
                  <View
                    key={cat.id || `cat-${cat.label}-${idx}`}
                    style={styles.barBlock}
                  >
                    <View style={cardStyles.row}>
                      <Text style={styles.catLabel}>{cat.label}</Text>
                      <Text style={styles.catPct}>{cat.percent}%</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${Math.min(100, cat.percent)}%` },
                        ]}
                      />
                    </View>
                    <Text style={cardStyles.cardMeta}>
                      {cat.done}/{cat.hours}h
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <Text style={cardStyles.sectionTitle}>Grade da Semana</Text>
          {schedule ? (
            <View style={cardStyles.card}>
              <WeeklyScheduleGrid schedule={schedule} />
            </View>
          ) : (
            <EmptyState
              title="Grade indisponível"
              message="Puxe para atualizar ou sincronize no site."
            />
          )}

          <Text style={cardStyles.sectionTitle}>Próximas entregas</Text>
          {pendingTasks.length === 0 ? (
            <EmptyState title="Nenhuma tarefa pendente" />
          ) : (
            pendingTasks.map((task, idx) => (
              <View
                key={String(task.id ?? `task-${idx}`)}
                style={[
                  cardStyles.card,
                  { borderLeftColor: task.subjectColor, borderLeftWidth: 3 },
                ]}
              >
                <Text style={cardStyles.cardTitle}>{task.title}</Text>
                <Text style={cardStyles.cardMeta}>
                  {task.subject} · {formatPtDate(task.dueDateIso)}
                  {task.dueTime ? ` · ${task.dueTime}` : ""}
                  {task.type === "grupo" ? " · Grupo" : ""}
                </Text>
                {task.description ? (
                  <Text style={cardStyles.cardMeta} numberOfLines={2}>
                    {task.description}
                  </Text>
                ) : null}
              </View>
            ))
          )}

          <Text style={cardStyles.sectionTitle}>Matérias em andamento</Text>
          {data.disciplinas.length === 0 ? (
            <EmptyState title="Nenhuma matéria cursando" />
          ) : (
            data.disciplinas.map((d) => (
              <View
                key={d.code}
                style={[
                  cardStyles.card,
                  { borderLeftColor: d.color, borderLeftWidth: 3 },
                ]}
              >
                <Text style={cardStyles.cardTitle}>{d.displayName}</Text>
                <Text style={cardStyles.cardMeta}>
                  {d.code}
                  {d.shortLabel ? ` · ${d.shortLabel}` : ""}
                </Text>
                <Text style={cardStyles.cardMeta}>
                  Nota {formatGrade(d.grade, d.gradeMax)} ·{" "}
                  {gradeRiskLabel(d.gradeRisk)} · Faltas {d.absences}/
                  {d.maxAbsences}
                  {d.tasks > 0 ? ` · ${d.tasks} tarefa(s)` : ""}
                </Text>
                {d.room ? (
                  <Text style={cardStyles.cardMeta}>Sala {d.room}</Text>
                ) : null}
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
  barBlock: {
    marginTop: 12,
  },
  catLabel: {
    color: brand.text,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  catPct: {
    color: brand.gold,
    fontWeight: "800",
    fontSize: 13,
  },
  barTrack: {
    marginTop: 6,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: brand.gold,
    borderRadius: 4,
  },
});
