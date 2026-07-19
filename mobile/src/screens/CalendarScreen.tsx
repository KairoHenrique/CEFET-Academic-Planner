import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type {
  AcademicDateSemesterGroup,
  CalendarEvent,
} from "@acme/api-contracts";
import { ApiClientError } from "../auth/api";
import {
  createCalendarEvent,
  toggleCalendarEvent,
} from "../api/mutations";
import { fetchCalendar } from "../cache/fetchers";
import { useOnSyncComplete } from "../sync/useOnSyncComplete";
import { brand } from "../theme/brand";
import {
  CALENDAR_FILTER_OPTIONS,
  CalendarMonthModule,
  FILTER_LABEL_TO_TYPE,
  type EventTypeFilter,
} from "../ui/CalendarMonthModule";
import { Card } from "../ui/cards";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";
import { SectionHeader } from "../ui/SectionHeader";

function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calendário F28 — espelho de `CalendarioView`:
 * filtros → mês + próximos → calendário acadêmico.
 */
export function CalendarScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [academicGroups, setAcademicGroups] = useState<
    AcademicDateSemesterGroup[]
  >([]);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EventTypeFilter>("todas");
  const [busyCreate, setBusyCreate] = useState(false);

  const activeLabel =
    Object.entries(FILTER_LABEL_TO_TYPE).find(([, v]) => v === filter)?.[0] ??
    "Todas";

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const cal = await fetchCalendar();
      setEvents(sortEvents(cal.data.events));
      setAcademicGroups(cal.data.academicDateGroups);
      setFromCache(cal.fromCache);
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

  async function onCreate(input: {
    title: string;
    date: string;
    type: "evento" | "tarefa" | "prova" | "aula" | "outro";
  }) {
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
                style={[styles.filterChip, active && styles.filterChipActive]}
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
        <CalendarMonthModule
          events={events}
          filter={filter}
          busyCreate={busyCreate}
          onToggleDone={(ev) => void onToggle(ev)}
          onCreateEvent={onCreate}
        />
      ) : null}

      <Card tight style={styles.academicCard}>
        <SectionHeader title="Calendário Acadêmico" icon="clipboard" />
        {academicGroups.length === 0 ? (
          <Text style={styles.emptyAcademic}>Nenhuma informação</Text>
        ) : (
          academicGroups.map((group, index) => (
            <View key={`${group.semestre}-${index}`} style={styles.semesterBlock}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <Text style={styles.semesterTitle}>
                Semestre{" "}
                <Text style={styles.semesterCode}>{group.semestre}</Text>
              </Text>
              {group.items.length === 0 ? (
                <Text style={styles.emptyAcademic}>Nenhuma informação</Text>
              ) : (
                group.items.map((item, iIdx) => (
                  <View
                    key={`${group.semestre}-${item.label}-${item.date}-${iIdx}`}
                    style={styles.academicRow}
                  >
                    <Text style={styles.academicLabel}>{item.label}</Text>
                    <Text style={styles.academicValue}>{item.date}</Text>
                  </View>
                ))
              )}
            </View>
          ))
        )}
      </Card>
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
  academicCard: {
    marginTop: brand.space3,
  },
  semesterBlock: {
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: brand.borderMuted,
    marginVertical: 12,
  },
  semesterTitle: {
    fontSize: 14,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
    marginBottom: 8,
  },
  semesterCode: {
    color: brand.gold,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
  },
  academicRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  academicLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.text,
  },
  academicValue: {
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textSecondary,
  },
  emptyAcademic: {
    fontSize: 13,
    color: brand.textMuted,
    paddingVertical: 8,
  },
});
