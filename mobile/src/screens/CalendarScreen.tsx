import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type {
  AcademicDateSemesterGroup,
  CalendarEvent,
} from "@acme/api-contracts";
import { ApiClientError } from "../auth/api";
import { fetchCalendar } from "../cache/fetchers";
import { brand } from "../theme/brand";
import { cardStyles, formatPtDate } from "../ui/cards";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBox } from "../ui/ErrorBox";
import { LoadingBlock } from "../ui/LoadingBlock";
import { Screen } from "../ui/Screen";

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
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [academicGroups, setAcademicGroups] = useState<
    AcademicDateSemesterGroup[]
  >([]);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await fetchCalendar();
      setEvents(sortEvents(result.data.events));
      setAcademicGroups(result.data.academicDateGroups);
      setFromCache(result.fromCache);
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
      subtitle="Eventos acadêmicos e datas importantes"
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
      {loading && events.length === 0 ? <LoadingBlock /> : null}
      {error && events.length === 0 && academicGroups.length === 0 ? (
        <ErrorBox message={error} onRetry={() => void load()} />
      ) : null}

      <Text style={cardStyles.sectionTitle}>Próximos eventos</Text>
      {events.length === 0 && !loading ? (
        <EmptyState title="Nenhum evento" message="Sua agenda está vazia." />
      ) : (
        events.slice(0, 40).map((ev) => (
          <View
            key={ev.id}
            style={[
              cardStyles.card,
              ev.color ? { borderLeftColor: ev.color, borderLeftWidth: 4 } : null,
            ]}
          >
            <View style={cardStyles.row}>
              <Text style={cardStyles.cardTitle}>{ev.title}</Text>
              <View style={cardStyles.badge}>
                <Text style={cardStyles.badgeText}>
                  {EVENT_TYPE_LABEL[ev.type] ?? ev.type}
                </Text>
              </View>
            </View>
            <Text style={cardStyles.cardMeta}>
              {formatPtDate(ev.date)}
              {ev.timeStart ? ` · ${ev.timeStart}` : ""}
              {ev.subject ? ` · ${ev.subject}` : ""}
            </Text>
            {ev.done ? (
              <Text style={styles.done}>Concluído</Text>
            ) : null}
          </View>
        ))
      )}

      <Text style={cardStyles.sectionTitle}>Datas acadêmicas</Text>
      {academicGroups.length === 0 && !loading ? (
        <EmptyState title="Sem datas acadêmicas" />
      ) : (
        academicGroups.map((group) => (
          <View key={group.semestre} style={styles.semesterBlock}>
            <Text style={styles.semesterTitle}>{group.semestre}</Text>
            {group.items.map((item) => (
              <View key={item.id} style={cardStyles.card}>
                <Text style={cardStyles.cardTitle}>{item.label}</Text>
                <Text style={cardStyles.cardMeta}>
                  {formatPtDate(item.date)}
                </Text>
              </View>
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  done: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#2e7d32",
  },
  semesterBlock: {
    marginBottom: 12,
  },
  semesterTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: brand.blue,
    marginBottom: 8,
  },
});
