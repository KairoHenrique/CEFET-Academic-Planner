import { useCallback, useState } from "react";
import { RefreshControl, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type {
  DashboardResponse,
  ScheduleApiResponse,
} from "@acme/api-contracts";
import { ApiClientError } from "../auth/api";
import { fetchDashboard, fetchSchedule } from "../cache/fetchers";
import { IntegrationModule } from "../features/dashboard/IntegrationModule";
import { StatsModule } from "../features/dashboard/StatsModule";
import { SubjectsModule } from "../features/dashboard/SubjectsModule";
import { UpcomingTasksModule } from "../features/dashboard/UpcomingTasksModule";
import { brand } from "../theme/brand";
import { cardStyles } from "../ui/cards";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";
import { WeeklyScheduleGrid } from "../ui/WeeklyScheduleGrid";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia,";
  if (hour < 18) return "Boa tarde,";
  return "Boa noite,";
}

/** Ordem F28: stats → tarefas → integralização → grade → matérias. */
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

  const firstName = data?.aluno.nome.split(" ")[0] ?? "";

  return (
    <Screen
      title={data ? `${greeting()} ${firstName}` : "Início"}
      subtitle={
        data
          ? `Semestre ${data.aluno.semestreAtual} · ${data.aluno.curso}`
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
          <StatsModule stats={data.stats} />
          <UpcomingTasksModule
            tasks={data.tarefas}
            onChanged={() => void load(true)}
          />
          <IntegrationModule integralizacao={data.integralizacao} />

          <Text style={cardStyles.sectionTitle}>Grade da Semana</Text>
          {schedule ? (
            <View style={cardStyles.card}>
              <WeeklyScheduleGrid schedule={schedule} compact />
            </View>
          ) : (
            <EmptyState
              title="Grade indisponível"
              message="Puxe para atualizar ou sincronize no site."
            />
          )}

          <SubjectsModule disciplinas={data.disciplinas} />
        </>
      ) : null}
    </Screen>
  );
}
