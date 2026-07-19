import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import type { AcademicTask } from "@acme/api-contracts";
import { toggleTarefa } from "../../api/mutations";
import { brand } from "../../theme/brand";
import { Card, formatPtDate } from "../../ui/cards";
import { EmptyState } from "../../ui/EmptyState";
import { SectionHeader } from "../../ui/SectionHeader";

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
    } catch {
      /* parent refresh */
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View style={{ marginBottom: brand.space2 }}>
      <SectionHeader title="Próximas Entregas" icon="tasks" />
      {pending.length === 0 ? (
        <EmptyState title="Nenhuma tarefa pendente" />
      ) : (
        pending.map((task, idx) => (
          <Card
            key={`task-${task.id}-${idx}`}
            tight
            style={{
              borderLeftColor: task.subjectColor,
              borderLeftWidth: 3,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontFamily: brand.fontBodyMed,
                  fontWeight: "500",
                  color: brand.text,
                }}
              >
                {task.title}
              </Text>
              {busyId === task.id ? (
                <ActivityIndicator color={brand.gold} />
              ) : (
                <Pressable
                  onPress={() => void onToggle(task)}
                  hitSlop={8}
                  style={{ minHeight: 44, justifyContent: "center" }}
                >
                  <Text
                    style={{
                      color: brand.gold,
                      fontWeight: "700",
                      fontSize: 12,
                      fontFamily: brand.fontBodyBold,
                    }}
                  >
                    Concluir
                  </Text>
                </Pressable>
              )}
            </View>
            <Text
              style={{
                marginTop: 4,
                fontSize: 12,
                color: brand.textSecondary,
                fontFamily: brand.fontBody,
              }}
            >
              {task.subject} · {formatPtDate(task.dueDateIso)}
              {task.dueTime ? ` · ${task.dueTime}` : ""}
              {task.type === "grupo" ? " · Grupo" : ""}
            </Text>
          </Card>
        ))
      )}
    </View>
  );
}
