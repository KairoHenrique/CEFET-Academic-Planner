import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type {
  AcademicDateSemesterGroup,
  CalendarEvent,
  ScheduleApiResponse,
} from "@acme/api-contracts";
import { ApiClientError } from "../auth/api";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  toggleCalendarEvent,
} from "../api/mutations";
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

const EVENT_TYPES = [
  "evento",
  "tarefa",
  "prova",
  "aula",
  "feriado",
  "outro",
] as const;

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
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<(typeof EVENT_TYPES)[number]>("evento");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  async function onCreate() {
    if (!title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      setFormError("Título e data AAAA-MM-DD são obrigatórios.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await createCalendarEvent({
        title: title.trim(),
        date: date.trim(),
        type,
      });
      setTitle("");
      setDate("");
      setShowForm(false);
      await load(true);
    } catch (err) {
      setFormError(
        err instanceof ApiClientError ? err.message : "Falha ao criar evento."
      );
    } finally {
      setBusy(false);
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

  function onDelete(ev: CalendarEvent) {
    Alert.alert("Excluir evento", `Remover “${ev.title}”?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deleteCalendarEvent(ev.id);
              await load(true);
            } catch {
              /* ignore */
            }
          })();
        },
      },
    ]);
  }

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
        <>
          <Pressable
            style={styles.addBtn}
            onPress={() => setShowForm((v) => !v)}
          >
            <Text style={styles.addBtnText}>
              {showForm ? "Cancelar" : "+ Novo evento"}
            </Text>
          </Pressable>

          {showForm ? (
            <View style={cardStyles.card}>
              <TextInput
                style={styles.input}
                placeholder="Título"
                placeholderTextColor={brand.textMuted}
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={styles.input}
                placeholder="Data (AAAA-MM-DD)"
                placeholderTextColor={brand.textMuted}
                value={date}
                onChangeText={setDate}
                autoCapitalize="none"
              />
              <View style={styles.typeRow}>
                {EVENT_TYPES.map((t) => (
                  <Pressable
                    key={t}
                    style={[styles.typeChip, type === t && styles.typeActive]}
                    onPress={() => setType(t)}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        type === t && styles.typeTextActive,
                      ]}
                    >
                      {EVENT_TYPE_LABEL[t]}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                style={[styles.saveBtn, busy && styles.disabled]}
                onPress={() => void onCreate()}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color={brand.text} />
                ) : (
                  <Text style={styles.saveText}>Salvar</Text>
                )}
              </Pressable>
              {formError ? <Text style={styles.error}>{formError}</Text> : null}
            </View>
          ) : null}

          {events.length === 0 && !loading ? (
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
                    {ev.done ? " ✓" : ""}
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
                <View style={styles.actions}>
                  <Pressable onPress={() => void onToggle(ev)}>
                    <Text style={styles.actionGold}>
                      {ev.done ? "Reabrir" : "Concluir"}
                    </Text>
                  </Pressable>
                  {ev.manual !== false ? (
                    <Pressable onPress={() => onDelete(ev)}>
                      <Text style={styles.actionDanger}>Excluir</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </>
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
  addBtn: {
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: brand.gold,
    alignItems: "center",
  },
  addBtnText: { color: brand.gold, fontWeight: "700" },
  input: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: brand.border,
    color: brand.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: brand.border,
  },
  typeActive: { borderColor: brand.gold, backgroundColor: "rgba(0,96,177,0.35)" },
  typeText: { color: brand.textMuted, fontSize: 12, fontWeight: "700" },
  typeTextActive: { color: brand.gold },
  saveBtn: {
    backgroundColor: brand.blue,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveText: { color: brand.text, fontWeight: "800" },
  disabled: { opacity: 0.55 },
  error: { color: brand.danger, marginTop: 8, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 16, marginTop: 10 },
  actionGold: { color: brand.gold, fontWeight: "700", fontSize: 12 },
  actionDanger: { color: brand.danger, fontWeight: "700", fontSize: 12 },
});
