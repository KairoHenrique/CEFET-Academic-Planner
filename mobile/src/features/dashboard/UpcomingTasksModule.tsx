import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AcademicTask } from "@acme/api-contracts";
import { toggleTarefa } from "../../api/mutations";
import type { RootStackParamList } from "../../navigation/types";
import { brand } from "../../theme/brand";
import { TaskDetailContent } from "../../ui/ActivityDetail";
import { Card, formatPtDate } from "../../ui/cards";
import { DetailModal } from "../../ui/DetailModal";
import { EmptyState } from "../../ui/EmptyState";
import { SectionHeader } from "../../ui/SectionHeader";
import { goldRipple, pressableOpacityStyle } from "../../ui/pressableStyles";

type Props = {
  tasks: AcademicTask[];
  onChanged?: () => void;
};

export function UpcomingTasksModule({ tasks, onChanged }: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selected, setSelected] = useState<AcademicTask | null>(null);
  const pending = tasks.filter((t) => !t.done).slice(0, 8);

  const selectedLive =
    selected && tasks.find((task) => task.id === selected.id);

  async function onToggle(task: AcademicTask) {
    setBusyId(task.id);
    try {
      await toggleTarefa(task.id, !task.done);
      onChanged?.();
      setSelected((prev) =>
        prev?.id === task.id ? { ...prev, done: !task.done } : prev
      );
    } catch {
      /* parent refresh */
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <View style={{ marginBottom: brand.space2 }}>
        <SectionHeader title="Próximas Entregas" icon="tasks" />
        {pending.length === 0 ? (
          <EmptyState title="Nenhuma tarefa pendente" />
        ) : (
          pending.map((task, idx) => (
            <Pressable
              key={`task-${task.id}-${idx}`}
              onPress={() => setSelected(task)}
              android_ripple={goldRipple}
              style={({ pressed }) => pressableOpacityStyle(pressed)}
            >
              <Card
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
                      onPress={(event) => {
                        event.stopPropagation();
                        void onToggle(task);
                      }}
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
            </Pressable>
          ))
        )}
      </View>

      <DetailModal
        visible={Boolean(selectedLive)}
        title={selectedLive?.title ?? "Tarefa"}
        onClose={() => setSelected(null)}
      >
        {selectedLive ? (
          <TaskDetailContent
            task={selectedLive}
            onClose={() => setSelected(null)}
            onOpenSubject={(code) =>
              navigation.navigate("DisciplinaDetail", { code })
            }
            onToggleDone={() => void onToggle(selectedLive)}
            onSubmitted={() => onChanged?.()}
          />
        ) : null}
      </DetailModal>
    </>
  );
}
