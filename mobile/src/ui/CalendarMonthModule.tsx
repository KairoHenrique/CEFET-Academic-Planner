import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { CalendarEvent, SubjectListItem } from "@acme/api-contracts";
import { hexWithAlpha } from "../lib/color-mix";
import { brand } from "../theme/brand";
import { Card, formatPtDate } from "./cards";
import { Icon } from "./Icon";
import { SectionHeader } from "./SectionHeader";
import {
  CreateCalendarEventModal,
  type CreateCalendarEventInput,
} from "./CreateCalendarEventModal";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const CALENDAR_FILTER_OPTIONS = [
  "Todas",
  "Tarefa",
  "Prova",
  "Aula",
  "Monitoria",
  "Estágio",
  "Estudo",
  "Evento",
  "Outro",
] as const;

export type EventTypeFilter =
  | "todas"
  | "tarefa"
  | "prova"
  | "aula"
  | "monitoria"
  | "estagio"
  | "estudo"
  | "evento"
  | "outro";

export const FILTER_LABEL_TO_TYPE: Record<string, EventTypeFilter> = {
  Todas: "todas",
  Tarefa: "tarefa",
  Prova: "prova",
  Aula: "aula",
  Monitoria: "monitoria",
  Estágio: "estagio",
  Estudo: "estudo",
  Evento: "evento",
  Outro: "outro",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  aula: "#1A8FE3",
  tarefa: "#D4A843",
  prova: "#F85149",
  evento: "#A371F7",
  feriado: "#94A3B4",
  monitoria: "#3FB950",
  estagio: "#58A6FF",
  estudo: "#D29922",
  outro: "#94A3B4",
};

const TYPE_LABEL: Record<string, string> = {
  tarefa: "TAREFA",
  prova: "PROVA",
  evento: "EVENTO",
  aula: "AULA",
  feriado: "FERIADO",
  monitoria: "MONITORIA",
  estagio: "ESTÁGIO",
  estudo: "ESTUDO",
  outro: "OUTRO",
};

type Props = {
  events: CalendarEvent[];
  filter: EventTypeFilter;
  busyCreate?: boolean;
  subjects?: SubjectListItem[];
  onToggleDone?: (ev: CalendarEvent) => void;
  onCreateEvent?: (input: CreateCalendarEventInput) => Promise<void> | void;
};

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function eventOnDay(ev: CalendarEvent, iso: string): boolean {
  const end = ev.dateEnd ?? ev.date;
  return iso >= ev.date && iso <= end;
}

function eventAccent(ev: CalendarEvent): string {
  return ev.color || EVENT_TYPE_COLORS[ev.type] || brand.gold;
}

/** Calendário F28 — mês (dots) + próximos eventos; toque no dia abre modal. */
export function CalendarMonthModule({
  events,
  filter,
  busyCreate = false,
  subjects = [],
  onToggleDone,
  onCreateEvent,
}: Props) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [dayModal, setDayModal] = useState<number | null>(null);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [addDate, setAddDate] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const monthLabel = cursor.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const filtered = useMemo(
    () =>
      filter === "todas" ? events : events.filter((ev) => ev.type === filter),
    [events, filter]
  );

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = toIso(year, month, day);
      map[day] = filtered.filter((ev) => eventOnDay(ev, iso));
    }
    return map;
  }, [filtered, year, month, daysInMonth]);

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const upcoming = useMemo(() => {
    const todayIso = toIso(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    return [...filtered]
      .filter((ev) => (ev.dateEnd ?? ev.date) >= todayIso)
      .sort((a, b) => {
        const byDate = a.date.localeCompare(b.date);
        if (byDate !== 0) return byDate;
        return a.title.localeCompare(b.title, "pt-BR");
      });
  }, [filtered]);

  const dayEvents = dayModal != null ? eventsByDay[dayModal] ?? [] : [];

  async function submitCreate(input: CreateCalendarEventInput) {
    if (!onCreateEvent) return;
    await onCreateEvent(input);
    setAddDate(null);
  }

  return (
    <>
      <Card tight>
        <View style={styles.monthHeader}>
          <Pressable
            style={styles.navBtn}
            onPress={() => setCursor(new Date(year, month - 1, 1))}
            accessibilityLabel="Mês anterior"
          >
            <Icon name="chevron-left" size={18} color={brand.textSecondary} />
          </Pressable>
          <Text style={styles.monthTitle}>{monthLabel}</Text>
          <Pressable
            style={styles.navBtn}
            onPress={() => setCursor(new Date(year, month + 1, 1))}
            accessibilityLabel="Próximo mês"
          >
            <Icon name="chevron-right" size={18} color={brand.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((d) => (
            <Text key={d} style={styles.weekday}>
              {d}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((day, idx) => {
            if (day == null) {
              return <View key={`e-${idx}`} style={styles.dayEmpty} />;
            }
            const dayEv = eventsByDay[day] ?? [];
            const todayCell = isToday(day);
            return (
              <Pressable
                key={`d-${day}`}
                style={[styles.dayCell, todayCell && styles.dayToday]}
                onPress={() => setDayModal(day)}
                accessibilityLabel={
                  dayEv.length > 0
                    ? `Dia ${day}, ${dayEv.length} evento${dayEv.length > 1 ? "s" : ""}`
                    : `Dia ${day}`
                }
              >
                <Text style={styles.dayNum}>{day}</Text>
                {dayEv.length > 0 ? (
                  <View style={styles.dots}>
                    {dayEv.slice(0, 4).map((ev, i) => (
                      <View
                        key={`${ev.id}-${i}`}
                        style={[
                          styles.dot,
                          { backgroundColor: eventAccent(ev) },
                        ]}
                      />
                    ))}
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card tight style={styles.eventsCard}>
        <SectionHeader title="Próximos Eventos" />
        {upcoming.length === 0 ? (
          <Text style={styles.emptyEvents}>Nenhum evento neste filtro.</Text>
        ) : (
          upcoming.map((ev, idx) => {
            const accent = eventAccent(ev);
            return (
              <Pressable
                key={`up-${ev.id}-${idx}`}
                style={styles.eventItem}
                onPress={() => setSelected(ev)}
              >
                <View style={[styles.eventDot, { backgroundColor: accent }]} />
                <View style={styles.eventBody}>
                  <Text
                    style={[
                      styles.eventTitle,
                      ev.done ? styles.eventDone : null,
                    ]}
                    numberOfLines={2}
                  >
                    {ev.title}
                  </Text>
                  <Text style={styles.eventMeta}>
                    {formatPtDate(ev.date)}
                    {ev.subject ? ` · ${ev.subject}` : ""}
                    {ev.timeStart ? ` · ${ev.timeStart}` : ""}
                  </Text>
                </View>
                <View
                  style={[
                    styles.typeBadge,
                    {
                      borderColor: hexWithAlpha(accent, 0.55),
                      backgroundColor: hexWithAlpha(accent, 0.16),
                    },
                  ]}
                >
                  <Text style={[styles.typeBadgeText, { color: accent }]}>
                    {TYPE_LABEL[ev.type] ?? ev.type.toUpperCase()}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </Card>

      {/* Eventos do dia */}
      <Modal
        visible={dayModal != null}
        transparent
        animationType="fade"
        onRequestClose={() => setDayModal(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDayModal(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              Eventos do dia {dayModal} · {monthLabel}
            </Text>
            {dayEvents.length === 0 ? (
              <Text style={styles.emptyEvents}>Nenhum evento neste dia.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 280 }}>
                {dayEvents.map((ev) => (
                  <Pressable
                    key={ev.id}
                    style={styles.eventItem}
                    onPress={() => {
                      setDayModal(null);
                      setSelected(ev);
                    }}
                  >
                    <View
                      style={[
                        styles.eventDot,
                        { backgroundColor: eventAccent(ev) },
                      ]}
                    />
                    <Text style={[styles.eventTitle, { flex: 1 }]} numberOfLines={2}>
                      {ev.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            {onCreateEvent ? (
              <Pressable
                style={styles.addDayBtn}
                onPress={() => {
                  if (dayModal == null) return;
                  setAddDate(toIso(year, month, dayModal));
                  setDayModal(null);
                }}
              >
                <Text style={styles.addDayBtnText}>+ Novo evento neste dia</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.closeBtn} onPress={() => setDayModal(null)}>
              <Text style={styles.closeBtnText}>Fechar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Detalhe do evento */}
      <Modal
        visible={selected != null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelected(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            {selected ? (
              <>
                <Text style={styles.modalTitle}>{selected.title}</Text>
                <Text style={styles.eventMeta}>
                  {formatPtDate(selected.date)}
                  {selected.subject ? ` · ${selected.subject}` : ""}
                </Text>
                {selected.description ? (
                  <Text style={[styles.eventMeta, { marginTop: 12 }]}>
                    {selected.description}
                  </Text>
                ) : null}
                {onToggleDone ? (
                  <Pressable
                    style={styles.addDayBtn}
                    onPress={() => {
                      onToggleDone(selected);
                      setSelected(null);
                    }}
                  >
                    <Text style={styles.addDayBtnText}>
                      {selected.done ? "Reabrir" : "Concluir"}
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={styles.closeBtn}
                  onPress={() => setSelected(null)}
                >
                  <Text style={styles.closeBtnText}>Fechar</Text>
                </Pressable>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Novo evento — paridade com AddEventForm do site */}
      <CreateCalendarEventModal
        visible={addDate != null}
        defaultDate={addDate}
        subjects={subjects}
        busy={busyCreate}
        onClose={() => setAddDate(null)}
        onSubmit={submitCreate}
      />
    </>
  );
}

const styles = StyleSheet.create({
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: brand.space3,
  },
  navBtn: {
    width: brand.touchMin,
    height: brand.touchMin,
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    flex: 1,
    textAlign: "center",
    color: brand.text,
    fontSize: 16,
    fontFamily: brand.fontDisplay,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  weekRow: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textMuted,
    textTransform: "uppercase",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayEmpty: {
    width: `${100 / 7}%`,
    minHeight: 48,
  },
  dayCell: {
    width: `${100 / 7}%`,
    minHeight: 48,
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    borderColor: brand.borderMuted,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: 2,
  },
  dayToday: {
    borderColor: brand.goldMuted,
    backgroundColor: "rgba(212,168,67,0.08)",
  },
  dayNum: {
    color: brand.text,
    fontSize: 13,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    lineHeight: 16,
  },
  dots: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 3,
    minHeight: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  eventsCard: {
    marginTop: 4,
  },
  emptyEvents: {
    fontSize: 13,
    color: brand.textMuted,
    fontFamily: brand.fontBody,
    paddingVertical: 8,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: brand.touchMin,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: brand.radiusSm,
    marginBottom: 4,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventBody: {
    flex: 1,
    minWidth: 0,
  },
  eventTitle: {
    fontSize: 14,
    fontFamily: brand.fontBodyMed,
    fontWeight: "500",
    color: brand.text,
  },
  eventDone: {
    opacity: 0.55,
    textDecorationLine: "line-through",
  },
  eventMeta: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalSheet: {
    backgroundColor: brand.bgSecondary,
    borderRadius: brand.radiusLg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
    marginBottom: 12,
    textTransform: "capitalize",
  },
  addDayBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.gold,
    alignItems: "center",
  },
  addDayBtnText: {
    color: brand.gold,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
  },
  closeBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  closeBtnText: {
    color: brand.textMuted,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: brand.border,
    color: brand.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
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
  typeActive: {
    borderColor: brand.gold,
    backgroundColor: "rgba(0,96,177,0.35)",
  },
  typeText: { color: brand.textMuted, fontSize: 11, fontWeight: "700" },
  typeTextActive: { color: brand.gold },
  saveBtn: {
    backgroundColor: brand.blue,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveText: { color: brand.text, fontWeight: "800" },
  formError: { color: brand.danger, marginBottom: 8, fontWeight: "600" },
});
