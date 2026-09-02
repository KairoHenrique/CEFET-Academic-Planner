import { useCallback, useState } from "react";
import { RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type {
  DashboardResponse,
  ScheduleApiResponse,
} from "@acme/api-contracts";
import { ApiClientError } from "../auth/api";
import { fetchDashboard, fetchSchedule } from "../cache/fetchers";
import { IntegrationModule } from "../features/dashboard/IntegrationModule";
import { RuSaldoChip } from "../features/dashboard/RuSaldoChip";
import { StatsModule } from "../features/dashboard/StatsModule";
import { SubjectsModule } from "../features/dashboard/SubjectsModule";
import { UpcomingTasksModule } from "../features/dashboard/UpcomingTasksModule";
import type { RootStackParamList } from "../navigation/types";
import { setAvatarFromNome } from "../perfil/avatar-store";
import { startManualLiteSync } from "../sync/manual-lite-sync";
import { useOnSyncComplete } from "../sync/useOnSyncComplete";
import { brand } from "../theme/brand";
import { ErrorBox } from "../ui/ErrorBox";
import { FadeInContent } from "../ui/FadeInContent";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";
import { WeeklyScheduleGrid } from "../ui/WeeklyScheduleGrid";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia,";
  if (hour < 18) return "Boa tarde,";
  return "Boa noite,";
}

/**
 * Dashboard F28 — header → Saldo RU → Stats → Tasks → Grade → Integralização → Subjects
 */
export function DashboardScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
      if (dash.data.aluno?.nome) {
        void setAvatarFromNome(dash.data.aluno.nome);
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        setError(
          "Nenhum dado sincronizado. Abra Sync (ícone na barra) e sincronize com o SIGAA."
        );
      } else {
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Não foi possível carregar o dashboard."
        );
      }
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

  const emptySchedule: ScheduleApiResponse = {
    days: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
    timeSlots: [
      "07:00 - 08:40",
      "08:55 - 10:35",
      "10:50 - 12:30",
      "13:50 - 15:30",
      "15:50 - 17:30",
      "19:00 - 20:40",
      "20:55 - 22:35",
    ],
    grid: Array.from({ length: 5 }, () =>
      Array.from({ length: 7 }, () => null)
    ),
  };

  return (
    <Screen
      eyebrow={
        data ? `Semestre ${data.aluno.semestreAtual}` : "ACME HUB"
      }
      title={data ? greeting() : "Dashboard"}
      highlight={data ? data.aluno.nome : undefined}
      subtitle={
        data
          ? `${data.aluno.curso} · CEFET-MG Divinópolis`
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
        <ErrorBox
          message={error}
          onRetry={() => {
            if (error.includes("sincronizado")) {
              void startManualLiteSync();
              return;
            }
            void load();
          }}
        />
      ) : null}

      <FadeInContent ready={Boolean(data)}>
        {data ? (
          <>
            <RuSaldoChip
              refeicoesDisponiveis={data.ru?.refeicoesDisponiveis ?? null}
            />
            <StatsModule stats={data.stats} />
            <UpcomingTasksModule
              tasks={data.tarefas}
              onChanged={() => void load(true)}
            />
            <WeeklyScheduleGrid
              schedule={schedule ?? emptySchedule}
              onOpenCalendar={() => navigation.navigate("Calendario")}
            />
            <IntegrationModule integralizacao={data.integralizacao} />
            <SubjectsModule
              disciplinas={data.disciplinas}
              onSeeAll={() => navigation.navigate("Disciplinas")}
              onOpenSubject={(code) =>
                navigation.navigate("DisciplinaDetail", { code })
              }
            />
          </>
        ) : null}
      </FadeInContent>
    </Screen>
  );
}
