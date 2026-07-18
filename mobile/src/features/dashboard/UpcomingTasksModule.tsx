import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import type { AcademicTask } from "@acme/api-contracts";
import { ApiClientError } from "../../auth/api";
import { toggleTarefa } from "../../api/mutations";
import { brand } from "../../theme/brand";
import { cardStyles, formatPtDate } from "../../ui/cards";
import { EmptyState } from "../../ui/EmptyState";

type Props = {
  tasks: AcademicTask[];
  onChanged?: () => void;
};

export function UpcomingTasksModule({ tasks, onChanged }: Props) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const pending = tasks.filter((t) => !t.done).slice(0, 8);

  async function onToggle(task: AcademicTask) {
    setBusyId(task.id);
    try {
      await toggleTarefa(task.id, true);
      onChanged?.();
    } catch (err) {
      // silent — parent can refresh
      void err;
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <Text style={cardStyles.sectionTitle}>Próximas entregas</Text>
      {pending.length === 0 ? (
        <EmptyState title="Nenhuma tarefa pendente" />
      ) : (
        pending.map((task, idx) => (
          <View
            key={`task-${task.id}-${idx}`}
            style={[
              cardStyles.card,
              { borderLeftColor: task.subjectColor, borderLeftWidth: 3 },
            ]}
          >
            <View style={cardStyles.row}>
              <Text style={[cardStyles.cardTitle, { flex: 1 }]}>
                {task.title}
              </Text>
              {busyId === task.id ? (
                <ActivityIndicator color={brand.gold} />
              ) : (
                <Pressable onPress={() => void onToggle(task)}>
                  <Text style={{ color: brand.gold, fontWeight: "700", fontSize: 12 }}>
                    Concluir
                  </Text>
                </Pressable>
              )}
            </View>
            <Text style={cardStyles.cardMeta}>
              {task.subject} · {formatPtDate(task.dueDateIso)}
              {task.dueTime ? ` · ${task.dueTime}` : ""}
              {task.type === "grupo" ? " · Grupo" : ""}
            </Text>
            {task.description ? (
              <Text style={cardStyles.cardMeta} numberOfLines={2}>
                {task.description}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </>
  );
}
