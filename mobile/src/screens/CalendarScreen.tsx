import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type {
  AcademicDateSemesterGroup,
  CalendarEvent,
  ScheduleApiResponse,
} from "@acme/api-contracts";
import { ApiClientError } from "../auth/api";
import { fetchCalendar, fetchSchedule } from "../cache/fetchers";
import { brand } from "../theme/brand";
import { cardStyles, formatPtDate } from "../ui/cards";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";
import { SegmentTabs } from "../ui/SegmentTabs";
import { WeeklyScheduleGrid } from "../ui/WeeklyScheduleGrid";

type Tab = "grade" | "eventos" | "datas";

const TABS = [
  { id: "grade" as const, label: "Grade" },
  { id: "eventos" as const, label: "Eventos" },
  { id: "datas" as const, label: "Datas" },
];

const EVENT_TYPE_LABEL: Record<string, string> = {
  tarefa: "Tarefa",
  prova: "Prova",
  evento: "Evento",
  aula: "Aula",
  feriado: "Feriado",
  outro: "Outro",
};

function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => a.date.localeCompare(b.date));
}

export function CalendarScreen() {
  const [tab, setTab] = useState<Tab>("grade");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [academicGroups, setAcademicGroups] = useState<
    AcademicDateSemesterGroup[]
  >([]);
  const [schedule, setSchedule] = useState<ScheduleApiResponse | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [cal, sched] = await Promise.all([
        fetchCalendar(),
        fetchSchedule().catch(() => null),
      ]);
      setEvents(sortEvents(cal.data.events));
      setAcademicGroups(cal.data.academicDateGroups);
      setFromCache(cal.fromCache || Boolean(sched?.fromCache));
      if (sched) setSchedule(sched.data);
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

  return (
    <Screen
      title="Agenda"
      subtitle="Grade semanal, eventos e datas acadêmicas"
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
      <SegmentTabs tabs={TABS} value={tab} onChange={setTab} />

      {loading && !schedule && events.length === 0 ? <LoadingBlock /> : null}
      {error && !schedule && events.length === 0 ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : null}

      {tab === "grade" ? (
        schedule ? (
          <View style={cardStyles.card}>
            <Text style={cardStyles.sectionTitle}>Grade da Semana</Text>
            <WeeklyScheduleGrid schedule={schedule} compact />
          </View>
        ) : (
          <EmptyState
            title="Sem grade"
            message="Sincronize com o SIGAA para ver os horários."
          />
        )
      ) : null}

      {tab === "eventos" ? (
        events.length === 0 && !loading ? (
          <EmptyState title="Nenhum evento" />
        ) : (
          events.map((ev, idx) => (
            <View
              key={`ev-${ev.id}-${idx}`}
              style={[
                cardStyles.card,
                ev.color
                  ? { borderLeftColor: ev.color, borderLeftWidth: 3 }
                  : null,
              ]}
            >
              <View style={cardStyles.row}>
                <Text style={[cardStyles.cardTitle, { flex: 1 }]}>
                  {ev.title}
                </Text>
                <View style={cardStyles.badge}>
                  <Text style={cardStyles.badgeText}>
                    {EVENT_TYPE_LABEL[ev.type] ?? ev.type}
                  </Text>
                </View>
              </View>
              <Text style={cardStyles.cardMeta}>
                {formatPtDate(ev.date)}
                {ev.timeStart ? ` · ${ev.timeStart}` : ""}
                {ev.timeEnd ? `–${ev.timeEnd}` : ""}
              </Text>
              {ev.subject ? (
                <Text style={cardStyles.cardMeta}>{ev.subject}</Text>
              ) : null}
              {ev.description ? (
                <Text style={cardStyles.cardMeta} numberOfLines={3}>
                  {ev.description}
                </Text>
              ) : null}
            </View>
          ))
        )
      ) : null}

      {tab === "datas" ? (
        academicGroups.length === 0 && !loading ? (
          <EmptyState title="Sem datas acadêmicas" />
        ) : (
          academicGroups.map((group, gIdx) => (
            <View
              key={`sem-${group.semestre}-${gIdx}`}
              style={styles.semesterBlock}
            >
              <Text style={styles.semesterTitle}>{group.semestre}</Text>
              {group.items.map((item, iIdx) => (
                <View
                  key={`date-${item.id}-${iIdx}`}
                  style={cardStyles.card}
                >
                  <Text style={cardStyles.cardTitle}>{item.label}</Text>
                  <Text style={cardStyles.cardMeta}>
                    {formatPtDate(item.date)}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  semesterBlock: { marginBottom: 12 },
  semesterTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: brand.gold,
    marginBottom: 8,
  },
});
