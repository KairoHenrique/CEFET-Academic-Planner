import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AcademicTask, CalendarEvent } from "@acme/api-contracts";
import {
  canDeleteCalendarEvent,
  canToggleCalendarEvent,
  formatCalendarEventDateLabel,
} from "../lib/calendar-event-utils";
import { brand } from "../theme/brand";
import { formatPtDate } from "./cards";
import { FormattedDescription } from "./FormattedDescription";
import { SubmitTaskPanel } from "../features/tasks/SubmitTaskPanel";
import { Icon } from "./Icon";

const TYPE_LABEL: Record<string, string> = {
  tarefa: "Tarefa",
  prova: "Prova",
  evento: "Evento",
  aula: "Aula",
  feriado: "Feriado",
  monitoria: "Monitoria",
  estagio: "Estágio",
  estudo: "Estudo",
  outro: "Outro",
};

function EventTypeBadge({
  type,
  color,
}: {
  type: string;
  color?: string;
}) {
  const accent = color || brand.gold;
  return (
    <View
      style={[
        styles.badge,
        { borderColor: accent, backgroundColor: `${accent}22` },
      ]}
    >
      <Text style={[styles.badgeText, { color: accent }]}>
        {(TYPE_LABEL[type] ?? type).toUpperCase()}
      </Text>
    </View>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "info";
}) {
  const colors = {
    success: { bg: "rgba(63,185,80,0.2)", border: "rgba(63,185,80,0.45)", text: brand.success },
    warning: { bg: "rgba(210,153,34,0.2)", border: "rgba(210,153,34,0.45)", text: "#D29922" },
    info: { bg: "rgba(88,166,255,0.18)", border: "rgba(88,166,255,0.4)", text: "#58A6FF" },
  }[tone];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.badgeText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

type EventDetailProps = {
  event: CalendarEvent;
  onClose: () => void;
  onToggleDone?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
  onOpenSubject?: (code: string) => void;
  isDeleting?: boolean;
};

export function EventDetailContent({
  event,
  onClose,
  onToggleDone,
  onDelete,
  onOpenSubject,
  isDeleting = false,
}: EventDetailProps) {
  const accent = event.color || brand.gold;

  return (
    <>
      <View style={styles.metaRow}>
        <View style={styles.badges}>
          <EventTypeBadge type={event.type} color={event.color} />
          {event.done ? <StatusBadge label="Concluída" tone="success" /> : null}
        </View>
        <Text style={styles.date}>{formatCalendarEventDateLabel(event)}</Text>
      </View>

      {event.subject ? (
        <View style={styles.subjectRow}>
          <View style={[styles.subjectDot, { backgroundColor: accent }]} />
          <Text style={styles.subject}>{event.subject}</Text>
        </View>
      ) : null}

      <FormattedDescription text={event.description} />

      <View style={styles.actions}>
        {event.subjectCode && onOpenSubject ? (
          <Pressable
            style={styles.btnGold}
            onPress={() => {
              onOpenSubject(event.subjectCode!);
              onClose();
            }}
          >
            <Icon name="books" size={14} color={brand.bg} />
            <Text style={styles.btnGoldText}>Ver disciplina</Text>
          </Pressable>
        ) : null}
        {canToggleCalendarEvent(event.id) && onToggleDone ? (
          <Pressable
            style={styles.btnOutline}
            onPress={() => onToggleDone(event)}
          >
            <Icon name="check" size={14} color={brand.gold} />
            <Text style={styles.btnOutlineText}>
              {event.done ? "Marcar pendente" : "Marcar concluída"}
            </Text>
          </Pressable>
        ) : null}
        {canDeleteCalendarEvent(event) && onDelete ? (
          <Pressable
            style={[styles.btnOutline, styles.btnDanger]}
            disabled={isDeleting}
            onPress={() => onDelete(event)}
          >
            <Icon name="close" size={14} color={brand.danger} />
            <Text style={[styles.btnOutlineText, { color: brand.danger }]}>
              {isDeleting ? "Excluindo…" : "Excluir"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </>
  );
}

type TaskDetailProps = {
  task: AcademicTask;
  onClose: () => void;
  onToggleDone?: () => void;
  onOpenSubject?: (code: string) => void;
  onSubmitted?: () => void;
};

export const TaskDetailContent = memo(function TaskDetailContent({
  task,
  onClose,
  onToggleDone,
  onOpenSubject,
  onSubmitted,
}: TaskDetailProps) {
  return (
    <>
      <View style={styles.metaRow}>
        <View style={styles.badges}>
          <StatusBadge
            label={task.type === "grupo" ? "Grupo" : "Individual"}
            tone="info"
          />
          <StatusBadge
            label={task.done ? "Concluída" : "Pendente"}
            tone={task.done ? "success" : "warning"}
          />
        </View>
        <Text style={styles.date}>
          {formatPtDate(task.dueDateIso)}
          {task.dueTime ? ` · até ${task.dueTime}` : ""}
        </Text>
      </View>

      <View style={styles.subjectRow}>
        <View
          style={[styles.subjectDot, { backgroundColor: task.subjectColor }]}
        />
        <Text style={styles.subject}>{task.subject}</Text>
      </View>

      <FormattedDescription text={task.description} />

      {task.instructions.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>O que fazer</Text>
          {task.instructions.map((item) => (
            <Text key={item} style={styles.listItem}>
              • {item}
            </Text>
          ))}
        </View>
      ) : null}

      {task.deliverables.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Entregáveis</Text>
          {task.deliverables.map((item) => (
            <Text key={item} style={styles.listItem}>
              • {item}
            </Text>
          ))}
        </View>
      ) : null}

      {task.hasGrade && task.maxGrade !== undefined ? (
        <Text style={styles.gradeNote}>
          Vale até <Text style={styles.gradeStrong}>{task.maxGrade} pontos</Text>{" "}
          na disciplina.
        </Text>
      ) : null}

      <SubmitTaskPanel task={task} onSubmitted={onSubmitted} />

      <View style={styles.actions}>
        {onOpenSubject ? (
          <Pressable
            style={styles.btnGold}
            onPress={() => {
              onOpenSubject(task.subjectCode);
              onClose();
            }}
          >
            <Icon name="books" size={14} color={brand.bg} />
            <Text style={styles.btnGoldText}>Ver disciplina</Text>
          </Pressable>
        ) : null}
        {onToggleDone ? (
          <Pressable style={styles.btnOutline} onPress={onToggleDone}>
            <Icon name="check" size={14} color={brand.gold} />
            <Text style={styles.btnOutlineText}>
              {task.done ? "Marcar pendente" : "Marcar concluída"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  metaRow: {
    gap: 8,
    marginBottom: 8,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  date: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
  },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  subjectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  subject: {
    flex: 1,
    fontSize: 15,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
  },
  block: {
    marginTop: 16,
    gap: 6,
  },
  blockTitle: {
    fontSize: 12,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
  },
  gradeNote: {
    marginTop: 16,
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
  },
  gradeStrong: {
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
  },
  actions: {
    marginTop: 20,
    gap: 10,
  },
  btnGold: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: brand.gold,
    borderRadius: brand.radiusMd,
    paddingVertical: 12,
  },
  btnGoldText: {
    color: brand.bg,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    fontSize: 14,
  },
  btnOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.borderEmphasis,
    paddingVertical: 12,
    backgroundColor: "rgba(212,168,67,0.06)",
  },
  btnOutlineText: {
    color: brand.gold200,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    fontSize: 14,
  },
  btnDanger: {
    borderColor: "rgba(248,81,73,0.45)",
    backgroundColor: "rgba(248,81,73,0.08)",
  },
});
