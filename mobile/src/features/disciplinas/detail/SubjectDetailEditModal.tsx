import { useEffect, useState } from "react";
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
import type { SubjectDetail } from "@acme/api-contracts";
import { brand } from "../../../theme/brand";

const NAME_MAX = 120;
const NICK_MAX = 10;
const ROOM_MAX = 40;
const SCHEDULE_MAX = 120;
const PROFESSOR_MAX = 80;

export type SubjectDetailEditPayload = {
  nome: string | null;
  apelido: string | null;
  sala: string | null;
  horario: string | null;
  professor: string | null;
  horasSemanais: number | null;
};

type Props = {
  open: boolean;
  subject: SubjectDetail;
  busy?: boolean;
  onClose: () => void;
  onSave: (payload: SubjectDetailEditPayload) => void;
};

function equalsPt(a: string, b: string): boolean {
  return a.localeCompare(b, "pt-BR", { sensitivity: "accent" }) === 0;
}

/** Espelho de `SubjectDetailEditModal` do site. */
export function SubjectDetailEditModal({
  open,
  subject,
  busy = false,
  onClose,
  onSave,
}: Props) {
  const suggestion = (subject.shortLabel || subject.code).slice(0, NICK_MAX);
  const portalRoom = subject.syncedRoom ?? subject.room;
  const portalSchedule = subject.syncedSchedule ?? subject.schedule ?? "";
  const portalProfessor = subject.syncedProfessor ?? subject.professor ?? "";
  const portalHours = subject.syncedWeeklyHours ?? subject.ch ?? null;

  const [nameValue, setNameValue] = useState(subject.name);
  const [nicknameValue, setNicknameValue] = useState(
    subject.nickname ?? suggestion
  );
  const [roomValue, setRoomValue] = useState(subject.room);
  const [scheduleValue, setScheduleValue] = useState(subject.schedule ?? "");
  const [professorValue, setProfessorValue] = useState(
    subject.professor ?? ""
  );
  const [hoursValue, setHoursValue] = useState(
    subject.ch != null ? String(subject.ch) : ""
  );

  useEffect(() => {
    if (!open) return;
    setNameValue(subject.name);
    setNicknameValue(subject.nickname ?? suggestion);
    setRoomValue(subject.room);
    setScheduleValue(subject.schedule ?? "");
    setProfessorValue(subject.professor ?? "");
    setHoursValue(subject.ch != null ? String(subject.ch) : "");
  }, [open, subject, suggestion]);

  function handleSave() {
    const trimmedName = nameValue.trim();
    const trimmedNickname = nicknameValue.trim();
    const trimmedRoom = roomValue.trim();
    const trimmedSchedule = scheduleValue.trim();
    const trimmedProfessor = professorValue.trim();
    const parsedHours = hoursValue.trim()
      ? Number.parseInt(hoursValue, 10)
      : null;

    onSave({
      nome: equalsPt(trimmedName, subject.officialName)
        ? null
        : trimmedName || null,
      apelido: trimmedNickname || null,
      sala: equalsPt(trimmedRoom, portalRoom) ? null : trimmedRoom || null,
      horario: equalsPt(trimmedSchedule, portalSchedule)
        ? null
        : trimmedSchedule || null,
      professor: equalsPt(trimmedProfessor, portalProfessor)
        ? null
        : trimmedProfessor || null,
      horasSemanais:
        parsedHours != null &&
        portalHours != null &&
        parsedHours === portalHours
          ? null
          : parsedHours,
    });
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Editar disciplina</Text>
          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <Field
              label="Nome da matéria"
              value={nameValue}
              onChange={setNameValue}
              maxLength={NAME_MAX}
              disabled={busy}
              hint={
                !equalsPt(subject.officialName, nameValue)
                  ? `Nome no SIGAA: ${subject.officialName}`
                  : "Como aparece no topo da página da disciplina."
              }
            />
            <Field
              label="Apelido"
              value={nicknameValue}
              onChange={setNicknameValue}
              maxLength={NICK_MAX}
              disabled={busy}
              hint={`Até ${NICK_MAX} caracteres. Usado na grade e no calendário.`}
            />
            <Field
              label="Sala"
              value={roomValue}
              onChange={setRoomValue}
              maxLength={ROOM_MAX}
              disabled={busy}
              hint={
                subject.syncedRoom && !equalsPt(roomValue, subject.syncedRoom)
                  ? `Sala no portal: ${subject.syncedRoom}`
                  : "Como aparece no horário do SIGAA."
              }
            />
            <Field
              label="Horário"
              value={scheduleValue}
              onChange={setScheduleValue}
              maxLength={SCHEDULE_MAX}
              disabled={busy}
              hint={
                subject.syncedSchedule &&
                !equalsPt(scheduleValue, subject.syncedSchedule)
                  ? `Horário no portal: ${subject.syncedSchedule}`
                  : "Dias e horários das aulas neste semestre."
              }
            />
            <Field
              label="Horas semanais"
              value={hoursValue}
              onChange={(v) => setHoursValue(v.replace(/\D/g, ""))}
              maxLength={2}
              disabled={busy}
              keyboardType="number-pad"
              hint={
                subject.syncedWeeklyHours != null &&
                hoursValue &&
                Number.parseInt(hoursValue, 10) !== subject.syncedWeeklyHours
                  ? `Calculado pelo horário: ${subject.syncedWeeklyHours}h/sem`
                  : "Derivado dos blocos do horário SIGAA (2h por aula)."
              }
            />
            <Field
              label="Professor(a)"
              value={professorValue}
              onChange={setProfessorValue}
              maxLength={PROFESSOR_MAX}
              disabled={busy}
              hint={
                subject.syncedProfessor &&
                !equalsPt(professorValue, subject.syncedProfessor)
                  ? `No portal: ${subject.syncedProfessor}`
                  : "Docente da turma, se disponível no sync."
              }
            />
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              style={[styles.goldBtn, busy && styles.disabled]}
              onPress={handleSave}
              disabled={busy || !nameValue.trim()}
            >
              {busy ? (
                <ActivityIndicator color="#1a1408" />
              ) : (
                <Text style={styles.goldBtnText}>Salvar</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.outlineBtn}
              onPress={() => setNicknameValue(suggestion)}
              disabled={busy}
            >
              <Text style={styles.outlineText}>Restaurar apelido</Text>
            </Pressable>
            <Pressable
              style={styles.outlineBtn}
              onPress={() => {
                setRoomValue(portalRoom === "—" ? "" : portalRoom);
                setScheduleValue(portalSchedule);
                setProfessorValue(portalProfessor);
                setHoursValue(portalHours != null ? String(portalHours) : "");
              }}
              disabled={busy}
            >
              <Text style={styles.outlineText}>Restaurar portal</Text>
            </Pressable>
            <Pressable
              style={styles.outlineBtn}
              onPress={onClose}
              disabled={busy}
            >
              <Text style={styles.outlineText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  maxLength,
  disabled,
  hint,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  disabled?: boolean;
  hint?: string;
  keyboardType?: "default" | "number-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        maxLength={maxLength}
        editable={!disabled}
        placeholderTextColor={brand.textMuted}
        keyboardType={keyboardType ?? "default"}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: brand.bgSecondary,
    borderTopLeftRadius: brand.radiusLg,
    borderTopRightRadius: brand.radiusLg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 17,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
    marginBottom: 12,
  },
  scroll: { maxHeight: 420 },
  field: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: brand.border,
    color: brand.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: brand.fontBody,
  },
  hint: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    lineHeight: 15,
  },
  actions: { gap: 8, marginTop: 8 },
  goldBtn: {
    backgroundColor: brand.gold,
    borderRadius: brand.radiusMd,
    paddingVertical: 12,
    alignItems: "center",
  },
  goldBtnText: {
    fontSize: 14,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#1a1408",
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: brand.radiusMd,
    paddingVertical: 10,
    alignItems: "center",
  },
  outlineText: {
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textSecondary,
  },
  disabled: { opacity: 0.55 },
});
