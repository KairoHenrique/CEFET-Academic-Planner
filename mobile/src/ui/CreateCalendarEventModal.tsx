import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import type { SubjectListItem } from "@acme/api-contracts";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MiniMonthCalendar } from "./MiniMonthCalendar";
import { brand } from "../theme/brand";

export const CREATE_EVENT_TYPES = [
  "tarefa",
  "prova",
  "aula",
  "evento",
  "monitoria",
  "estagio",
  "estudo",
  "outro",
] as const;

export type CreateEventType = (typeof CREATE_EVENT_TYPES)[number];

export const UNLINKED_SUBJECT = "__none__";

const TYPE_LABEL: Record<CreateEventType, string> = {
  tarefa: "Tarefa",
  prova: "Prova",
  aula: "Aula",
  evento: "Evento",
  monitoria: "Monitoria",
  estagio: "Estágio",
  estudo: "Estudo",
  outro: "Outro",
};

const TYPE_COLORS: Record<CreateEventType, string> = {
  aula: "#1A8FE3",
  tarefa: "#D4A843",
  prova: "#F85149",
  evento: "#A371F7",
  monitoria: "#39D0D8",
  estagio: "#3FB950",
  estudo: "#58A6FF",
  outro: "#94A3B4",
};

const COLOR_PRESETS = [
  "#D4A843",
  "#1A8FE3",
  "#F85149",
  "#A371F7",
  "#39D0D8",
  "#3FB950",
  "#58A6FF",
  "#94A3B4",
  "#E3B341",
  "#F778BA",
] as const;

/** Segunda=0 … Domingo=6 — mesmo contrato do site. */
const WEEKDAY_OPTIONS = [
  { index: 0, short: "S", label: "Segunda" },
  { index: 1, short: "T", label: "Terça" },
  { index: 2, short: "Q", label: "Quarta" },
  { index: 3, short: "Q", label: "Quinta" },
  { index: 4, short: "S", label: "Sexta" },
  { index: 5, short: "S", label: "Sábado" },
  { index: 6, short: "D", label: "Domingo" },
] as const;

export type CreateCalendarEventInput = {
  title: string;
  date: string;
  type: CreateEventType;
  description?: string;
  dateEnd?: string;
  timeStart?: string;
  timeEnd?: string;
  recurrence?: "none" | "weekly";
  recurrenceDays?: number[];
  subjectCode?: string;
  color?: string;
};

type Props = {
  visible: boolean;
  defaultDate: string | null;
  subjects: SubjectListItem[];
  busy?: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCalendarEventInput) => Promise<void> | void;
};

function resolveDefaultColor(
  type: CreateEventType,
  subjectColor: string | null | undefined
): string {
  if (type === "aula" && subjectColor) return subjectColor;
  return TYPE_COLORS[type];
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isHm(value: string): boolean {
  return !value || /^\d{2}:\d{2}$/.test(value);
}

function formatIsoToBR(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function CreateCalendarEventModal({
  visible,
  defaultDate,
  subjects,
  busy = false,
  onClose,
  onSubmit,
}: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CreateEventType>("tarefa");
  const [subjectCode, setSubjectCode] = useState(UNLINKED_SUBJECT);
  const [color, setColor] = useState(TYPE_COLORS.tarefa);
  const [colorTouched, setColorTouched] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [activePicker, setActivePicker] = useState<"startDate" | "startTime" | "endDate" | "endTime" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subjectMenuOpen, setSubjectMenuOpen] = useState(false);

  const activeSubject = subjects.find((item) => item.code === subjectCode);
  const isUnlinked = subjectCode === UNLINKED_SUBJECT;
  const hasWeekly = recurrenceDays.length > 0;

  const previewColor = useMemo(() => {
    if (colorTouched && color) return color;
    return resolveDefaultColor(type, activeSubject?.color);
  }, [activeSubject?.color, color, colorTouched, type]);

  const subjectPickerItems = useMemo(
    () => [
      { code: UNLINKED_SUBJECT, name: "Não associado à matéria" },
      ...subjects.map((item) => ({ code: item.code, name: item.name })),
    ],
    [subjects]
  );

  useEffect(() => {
    if (!visible || !defaultDate) return;
    setTitle("");
    setDescription("");
    setType("tarefa");
    setSubjectCode(UNLINKED_SUBJECT);
    setColorTouched(false);
    setColor(TYPE_COLORS.tarefa);
    setStartDate(defaultDate);
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setRecurrenceDays([]);
    setActivePicker(null);
    setError(null);
    setSubjectMenuOpen(false);
  }, [visible, defaultDate, subjects]);

  useEffect(() => {
    if (colorTouched) return;
    setColor(resolveDefaultColor(type, isUnlinked ? null : activeSubject?.color));
  }, [activeSubject?.color, colorTouched, isUnlinked, type]);

  function toggleDay(day: number) {
    setRecurrenceDays((prev) =>
      prev.includes(day)
        ? prev.filter((value) => value !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  }

  const onPickerChange = (event: { type?: string }, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setActivePicker(null);
    }
    if (event.type === "dismissed" || !selectedDate) {
      if (Platform.OS === "ios") setActivePicker(null);
      return;
    }

    const current = activePicker;
    if (current !== "startTime" && current !== "endTime") return;

    const h = String(selectedDate.getHours()).padStart(2, "0");
    const min = String(selectedDate.getMinutes()).padStart(2, "0");
    const str = `${h}:${min}`;
    if (current === "startTime") setStartTime(str);
    else setEndTime(str);
  };

  function getPickerValue() {
    if (activePicker === "startTime" && startTime) {
      const d = new Date();
      const [h, m] = startTime.split(":");
      d.setHours(Number(h), Number(m));
      return d;
    }
    if (activePicker === "endTime" && endTime) {
      const d = new Date();
      const [h, m] = endTime.split(":");
      d.setHours(Number(h), Number(m));
      return d;
    }
    return new Date();
  }

  async function handleSubmit() {
    if (busy) return;
    if (!title.trim()) {
      setError("Informe o título.");
      return;
    }
    if (!isIsoDate(startDate)) {
      setError("Informe a data de início.");
      return;
    }
    if (!isHm(startTime) || !isHm(endTime)) {
      setError("Hora inválida (use HH:MM).");
      return;
    }
    if (endDate && !isIsoDate(endDate)) {
      setError("Data de fim inválida.");
      return;
    }
    if (hasWeekly && !endDate) {
      setError("Com dias da semana, informe a data de fim.");
      return;
    }

    setError(null);
    await onSubmit({
      title: title.trim(),
      description:
        description.trim() ||
        (isUnlinked
          ? "Evento pessoal adicionado manualmente."
          : "Tarefa adicionada manualmente."),
      type,
      date: startDate,
      dateEnd: endDate || undefined,
      timeStart: startTime || undefined,
      timeEnd: endTime || undefined,
      recurrence: hasWeekly ? "weekly" : "none",
      recurrenceDays: hasWeekly ? recurrenceDays : undefined,
      subjectCode: isUnlinked ? undefined : subjectCode,
      color: colorTouched ? color || previewColor : undefined,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Fechar"
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetWrap}
        >
          <View
            style={[
              styles.sheet,
              subjectMenuOpen && { height: Math.round(windowHeight * 0.88) },
            ]}
          >
          <View style={styles.head}>
            <Text style={styles.title}>Novo evento</Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Fechar">
              <Text style={styles.closeX}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            keyboardDismissMode="on-drag"
            scrollEnabled={!subjectMenuOpen}
          >
            <Text style={styles.label}>Título</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: Revisar capítulo 3"
              placeholderTextColor={brand.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Disciplina</Text>
            <Pressable
              style={styles.select}
              onPress={() => setSubjectMenuOpen(true)}
            >
              <Text style={styles.selectText} numberOfLines={1}>
                {isUnlinked
                  ? "Não associado à matéria"
                  : activeSubject?.name ?? subjectCode}
              </Text>
            </Pressable>

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.chipRow}>
              {CREATE_EVENT_TYPES.map((value) => {
                const active = type === value;
                return (
                  <Pressable
                    key={value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setType(value)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {TYPE_LABEL[value]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.colorHead}>
              <Text style={styles.labelInline}>Cor no calendário</Text>
              <View
                style={[styles.colorDot, { backgroundColor: previewColor }]}
              />
            </View>
            <View style={styles.chipRow}>
              {COLOR_PRESETS.map((hex) => (
                <Pressable
                  key={hex}
                  style={[
                    styles.swatch,
                    { backgroundColor: hex },
                    previewColor === hex && styles.swatchActive,
                  ]}
                  onPress={() => {
                    setColorTouched(true);
                    setColor(hex);
                  }}
                />
              ))}
            </View>
            <Text style={styles.hint}>
              Cor automática por tipo se você não personalizar.
            </Text>

            <Text style={styles.label}>Início</Text>
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.subLabel}>Data de início</Text>
                <Pressable
                  style={[styles.input, { justifyContent: "center" }]}
                  onPress={() =>
                    setActivePicker((current) =>
                      current === "startDate" ? null : "startDate"
                    )
                  }
                >
                  <Text style={{ color: startDate ? brand.text : brand.textMuted, fontFamily: brand.fontBody, fontSize: 14 }}>
                    {formatIsoToBR(startDate) || "DD/MM/AAAA"}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.half}>
                <Text style={styles.subLabel}>Hora de início</Text>
                <Pressable
                  style={[styles.input, { justifyContent: "center" }]}
                  onPress={() =>
                    setActivePicker((current) =>
                      current === "startTime" ? null : "startTime"
                    )
                  }
                >
                  <Text style={{ color: startTime ? brand.text : brand.textMuted, fontFamily: brand.fontBody, fontSize: 14 }}>
                    {startTime || "HH:MM"}
                  </Text>
                </Pressable>
              </View>
            </View>
            {activePicker === "startDate" ? (
              <MiniMonthCalendar
                value={startDate}
                onSelect={(iso) => {
                  setStartDate(iso);
                  setActivePicker(null);
                }}
              />
            ) : null}

            <Text style={styles.label}>
              Fim {hasWeekly ? "(obrigatório p/ repetir)" : "(opcional)"}
            </Text>
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.subLabel}>Data de fim</Text>
                <Pressable
                  style={[styles.input, { justifyContent: "center" }]}
                  onPress={() =>
                    setActivePicker((current) =>
                      current === "endDate" ? null : "endDate"
                    )
                  }
                >
                  <Text style={{ color: endDate ? brand.text : brand.textMuted, fontFamily: brand.fontBody, fontSize: 14 }}>
                    {formatIsoToBR(endDate) || "DD/MM/AAAA"}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.half}>
                <Text style={styles.subLabel}>Hora de fim</Text>
                <Pressable
                  style={[styles.input, { justifyContent: "center" }]}
                  onPress={() =>
                    setActivePicker((current) =>
                      current === "endTime" ? null : "endTime"
                    )
                  }
                >
                  <Text style={{ color: endTime ? brand.text : brand.textMuted, fontFamily: brand.fontBody, fontSize: 14 }}>
                    {endTime || "HH:MM"}
                  </Text>
                </Pressable>
              </View>
            </View>
            {activePicker === "endDate" ? (
              <MiniMonthCalendar
                value={endDate}
                min={startDate || undefined}
                allowClear={!hasWeekly}
                onSelect={(iso) => {
                  setEndDate(iso);
                  setActivePicker(null);
                }}
              />
            ) : null}
            <Text style={styles.hint}>
              {hasWeekly
                ? "Repete toda semana nos dias marcados, até a data de fim."
                : "Sem fim informado, vale só no dia de início."}
            </Text>

            <Text style={styles.label}>Dias da semana</Text>
            <View style={styles.weekdayRow}>
              {WEEKDAY_OPTIONS.map((day) => {
                const active = recurrenceDays.includes(day.index);
                return (
                  <Pressable
                    key={day.index}
                    style={[styles.weekday, active && styles.weekdayActive]}
                    onPress={() => toggleDay(day.index)}
                    accessibilityLabel={day.label}
                  >
                    <Text
                      style={[
                        styles.weekdayText,
                        active && styles.weekdayTextActive,
                      ]}
                    >
                      {day.short}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.hint}>Opcional</Text>

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder={
                isUnlinked
                  ? "Estágio, monitoria, projeto pessoal…"
                  : "O que precisa ser feito?"
              }
              placeholderTextColor={brand.textMuted}
              multiline
              textAlignVertical="top"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={[styles.saveBtn, busy && { opacity: 0.6 }]}
              disabled={busy}
              onPress={() => void handleSubmit()}
            >
              {busy ? (
                <ActivityIndicator color="#1a1408" />
              ) : (
                <Text style={styles.saveText}>Salvar evento</Text>
              )}
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={busy}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </ScrollView>
          {subjectMenuOpen ? (
            <View style={styles.subjectOverlay}>
              <View style={styles.subjectOverlayInner}>
                <View style={styles.subjectOverlayHead}>
                  <Text style={styles.subjectOverlayTitle}>Disciplina</Text>
                  <Pressable
                    onPress={() => setSubjectMenuOpen(false)}
                    hitSlop={8}
                    accessibilityLabel="Fechar lista de disciplinas"
                  >
                    <Text style={styles.closeX}>✕</Text>
                  </Pressable>
                </View>
                <FlatList
                  data={subjectPickerItems}
                  keyExtractor={(item) => item.code}
                  keyboardShouldPersistTaps="handled"
                  style={styles.subjectList}
                  contentContainerStyle={styles.menuContent}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.menuItem}
                      onPress={() => {
                        setSubjectCode(item.code);
                        setSubjectMenuOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.menuText,
                          item.code === subjectCode && styles.menuTextActive,
                        ]}
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>
                    </Pressable>
                  )}
                />
              </View>
            </View>
          ) : null}
          {activePicker === "startTime" || activePicker === "endTime" ? (
            <DateTimePicker
              value={getPickerValue()}
              mode="time"
              display={Platform.OS === "android" ? "default" : "spinner"}
              locale="pt-BR"
              is24Hour
              onChange={onPickerChange}
            />
          ) : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 16,
  },
  sheetWrap: {
    width: "100%",
    maxHeight: "92%",
  },
  sheet: {
    maxHeight: "92%",
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.bgElevated,
    overflow: "hidden",
  },
  subjectOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: brand.bgElevated,
    zIndex: 30,
  },
  subjectOverlayInner: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  subjectOverlayHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 8,
  },
  subjectOverlayTitle: {
    fontSize: 18,
    fontFamily: brand.fontDisplay,
    fontWeight: "700",
    color: brand.text,
  },
  subjectList: {
    flex: 1,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: brand.fontDisplay,
    fontWeight: "700",
    color: brand.text,
  },
  closeX: {
    fontSize: 18,
    color: brand.textMuted,
    padding: 4,
  },
  scroll: { maxHeight: "100%" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20, gap: 6 },
  label: {
    marginTop: 10,
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.gold200,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  labelInline: {
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.gold200,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  subLabel: {
    fontSize: 11,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    marginBottom: 4,
  },
  input: {
    minHeight: 44,
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(0,0,0,0.22)",
    color: brand.text,
    paddingHorizontal: 12,
    fontFamily: brand.fontBody,
    fontSize: 14,
  },
  textarea: {
    minHeight: 88,
    paddingVertical: 10,
  },
  select: {
    minHeight: 44,
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(0,0,0,0.22)",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  selectText: {
    color: brand.text,
    fontFamily: brand.fontBody,
    fontSize: 14,
  },
  menuContent: {
    paddingVertical: 4,
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: brand.borderMuted,
  },
  menuText: {
    color: brand.text,
    fontFamily: brand.fontBody,
    fontSize: 13,
  },
  menuTextActive: {
    color: brand.gold200,
    fontWeight: "700",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  chipActive: {
    borderColor: brand.gold,
    backgroundColor: "rgba(232,198,106,0.14)",
  },
  chipText: {
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textMuted,
  },
  chipTextActive: { color: brand.gold200 },
  colorHead: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchActive: {
    borderColor: brand.gold,
  },
  hint: {
    fontSize: 11,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    marginTop: 2,
  },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  weekday: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayActive: {
    borderColor: brand.gold,
    backgroundColor: "rgba(232,198,106,0.18)",
  },
  weekdayText: {
    fontSize: 12,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.textMuted,
  },
  weekdayTextActive: { color: brand.gold200 },
  error: {
    marginTop: 8,
    color: brand.danger,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    fontSize: 13,
  },
  saveBtn: {
    marginTop: 14,
    minHeight: 48,
    borderRadius: brand.radiusMd,
    backgroundColor: brand.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    fontSize: 15,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#1a1408",
  },
  cancelBtn: {
    marginTop: 8,
    minHeight: 44,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.borderGold ?? brand.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 14,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.gold200,
  },
});
