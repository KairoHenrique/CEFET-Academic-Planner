import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type {
  AcademicDateSemesterGroup,
  AcademicTask,
  CalendarEvent,
} from "@acme/api-contracts";
import { ApiClientError } from "../auth/api";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  toggleCalendarEvent,
  toggleTarefa,
} from "../api/mutations";
import { fetchCalendar, fetchDashboard, fetchDisciplinas } from "../cache/fetchers";
import type { SubjectListItem } from "@acme/api-contracts";
import type { CreateCalendarEventInput } from "../ui/CreateCalendarEventModal";
import { useOnSyncComplete } from "../sync/useOnSyncComplete";
import { brand } from "../theme/brand";
import {
  CALENDAR_FILTER_OPTIONS,
  CalendarMonthModule,
  FILTER_LABEL_TO_TYPE,
  type EventTypeFilter,
} from "../ui/CalendarMonthModule";
import { AcademicCalendarModule } from "../ui/AcademicCalendarModule";
import { Card } from "../ui/cards";
import { ErrorBox } from "../ui/ErrorBox";
import { FadeInContent } from "../ui/FadeInContent";
import { LoadingBlock } from "../ui/LoadingBlock";
import { goldRipple, pressableOpacityStyle } from "../ui/pressableStyles";
import { Screen } from "../ui/Screen";
import { SectionHeader } from "../ui/SectionHeader";
import type { RootStackParamList } from "../navigation/types";

function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calendário F28 — espelho de `CalendarioView`:
 * filtros → mês + próximos → calendário acadêmico.
 */
export function CalendarScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<AcademicTask[]>([]);
  const [academicGroups, setAcademicGroups] = useState<
    AcademicDateSemesterGroup[]
  >([]);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EventTypeFilter>("todas");
  const [busyCreate, setBusyCreate] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);
  const [subjects, setSubjects] = useState<SubjectListItem[]>([]);

  const activeLabel =
    Object.entries(FILTER_LABEL_TO_TYPE).find(([, v]) => v === filter)?.[0] ??
    "Todas";

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [cal, disciplinas, dash] = await Promise.all([
        fetchCalendar(),
        fetchDisciplinas().catch(() => null),
        fetchDashboard().catch(() => null),
      ]);
      setEvents(sortEvents(cal.data.events));
      setAcademicGroups(cal.data.academicDateGroups);
      setFromCache(cal.fromCache);
      if (dash) {
        setTasks(dash.data.tarefas ?? []);
      }
      if (disciplinas) {
        setSubjects(disciplinas.data.items ?? []);
      }
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível carregar o calendário."
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

  async function onCreate(input: CreateCalendarEventInput) {
    setBusyCreate(true);
    try {
      await createCalendarEvent(input);
      await load(true);
    } finally {
      setBusyCreate(false);
    }
  }

  async function onToggle(ev: CalendarEvent) {
    try {
      await toggleCalendarEvent(ev.id, !(ev.done ?? false));
      await load(true);
    } catch {
      /* ignore */
    }
  }

  async function onDelete(ev: CalendarEvent) {
    setBusyDelete(true);
    try {
      await deleteCalendarEvent(ev.id);
      await load(true);
    } finally {
      setBusyDelete(false);
    }
  }

  async function onToggleTask(task: AcademicTask) {
    try {
      await toggleTarefa(task.id, !task.done);
      await load(true);
    } catch {
      /* ignore */
    }
  }

  function openSubject(code: string) {
    navigation.navigate("DisciplinaDetail", { code });
  }

  const aulaCount = events.filter((ev) => ev.type === "aula").length;

  return (
    <Screen
      title="Calendário"
      eyebrow="Agenda"
      subtitle="Clique em qualquer atividade para ver detalhes"
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
      {loading && events.length === 0 ? <LoadingBlock /> : null}
      {error && events.length === 0 ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : null}

      {error && events.length > 0 ? (
        <Text style={styles.inlineError}>{error}</Text>
      ) : null}

      <Card tight style={styles.filtersCard}>
        <SectionHeader title="Filtrar eventos" icon="filter" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {CALENDAR_FILTER_OPTIONS.map((label) => {
            const active = label === activeLabel;
            return (
              <Pressable
                key={label}
                style={({ pressed }) =>
                  pressableOpacityStyle(pressed, [
                    styles.filterChip,
                    active && styles.filterChipActive,
                  ])
                }
                android_ripple={goldRipple}
                onPress={() =>
                  setFilter(FILTER_LABEL_TO_TYPE[label] ?? "todas")
                }
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

      {!loading || events.length > 0 ? (
        <FadeInContent ready={!loading || events.length > 0}>
          <CalendarMonthModule
            events={events}
            tasks={tasks}
            filter={filter}
            busyCreate={busyCreate}
            busyDelete={busyDelete}
            subjects={subjects}
            onToggleDone={(ev) => void onToggle(ev)}
            onDeleteEvent={(ev) => onDelete(ev)}
            onCreateEvent={onCreate}
            onOpenSubject={openSubject}
            onToggleTask={(task) => void onToggleTask(task)}
          />
          {filter === "aula" && aulaCount === 0 ? (
            <Text style={styles.aulaHint}>
              Aulas vêm da grade do SIGAA após sincronizar. Use o ícone de sync na
              barra superior.
            </Text>
          ) : null}
          <AcademicCalendarModule groups={academicGroups} />
        </FadeInContent>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  inlineError: {
    color: brand.danger,
    marginBottom: 8,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
  },
  filtersCard: {
    marginBottom: brand.space3,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
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
  aulaHint: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    paddingHorizontal: 4,
  },
});
