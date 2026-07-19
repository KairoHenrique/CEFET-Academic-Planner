import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { SubjectListItem } from "@acme/api-contracts";
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

export function CreateCalendarEventModal({
  visible,
  defaultDate,
  subjects,
  busy = false,
  onClose,
  onSubmit,
}: Props) {
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
  const [error, setError] = useState<string | null>(null);
  const [subjectMenuOpen, setSubjectMenuOpen] = useState(false);

  const activeSubject = subjects.find((item) => item.code === subjectCode);
  const isUnlinked = subjectCode === UNLINKED_SUBJECT;
  const hasWeekly = recurrenceDays.length > 0;

  const previewColor = useMemo(() => {
    if (colorTouched && color) return color;
    return resolveDefaultColor(type, activeSubject?.color);
  }, [activeSubject?.color, color, colorTouched, type]);

  useEffect(() => {
    if (!visible || !defaultDate) return;
    setTitle("");
    setDescription("");
    setType("tarefa");
    setSubjectCode(subjects[0]?.code ?? UNLINKED_SUBJECT);
    setColorTouched(false);
    setColor(TYPE_COLORS.tarefa);
    setStartDate(defaultDate);
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setRecurrenceDays([]);
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

  async function handleSubmit() {
    if (busy) return;
    if (!title.trim()) {
      setError("Informe o título.");
      return;
    }
    if (!isIsoDate(startDate)) {
      setError("Data de início inválida (use AAAA-MM-DD).");
      return;
    }
    if (!isHm(startTime) || !isHm(endTime)) {
      setError("Hora inválida (use HH:MM).");
      return;
    }
    if (endDate && !isIsoDate(endDate)) {
      setError("Data de fim inválida (use AAAA-MM-DD).");
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
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
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
              onPress={() => setSubjectMenuOpen((open) => !open)}
            >
              <Text style={styles.selectText} numberOfLines={1}>
                {isUnlinked
                  ? "Não associado à matéria"
                  : activeSubject?.name ?? subjectCode}
              </Text>
            </Pressable>
            {subjectMenuOpen ? (
              <View style={styles.menu}>
                  <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    setSubjectCode(UNLINKED_SUBJECT);
                    setSubjectMenuOpen(false);
                  }}
                >
                  <Text style={styles.menuText}>Não associado à matéria</Text>
                </Pressable>
                {subjects.map((item) => (
                  <Pressable
                    key={item.code}
                    style={styles.menuItem}
                    onPress={() => {
                      setSubjectCode(item.code);
                      setSubjectMenuOpen(false);
                    }}
                  >
                    <Text style={styles.menuText} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

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
                <TextInput
                  style={styles.input}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={brand.textMuted}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.subLabel}>Hora de início</Text>
                <TextInput
                  style={styles.input}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="HH:MM"
                  placeholderTextColor={brand.textMuted}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <Text style={styles.label}>
              Fim {hasWeekly ? "(obrigatório p/ repetir)" : "(opcional)"}
            </Text>
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.subLabel}>Data de fim</Text>
                <TextInput
                  style={styles.input}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={brand.textMuted}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.subLabel}>Hora de fim</Text>
                <TextInput
                  style={styles.input}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="HH:MM"
                  placeholderTextColor={brand.textMuted}
                  autoCapitalize="none"
                />
              </View>
            </View>
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
        </Pressable>
      </Pressable>
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
  sheet: {
    maxHeight: "92%",
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.bgElevated,
    overflow: "hidden",
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
  menu: {
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.bg,
    maxHeight: 180,
    overflow: "hidden",
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
