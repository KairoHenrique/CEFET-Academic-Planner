import { StyleSheet, Text, View } from "react-native";
import type { AcademicTask } from "@acme/api-contracts";
import { brand } from "../../../theme/brand";
import { cardStyles, formatPtDate } from "../../../ui/cards";
import { EmptyState } from "../../../ui/EmptyState";

type Props = { tasks: AcademicTask[] };

export function SubjectTarefasTab({ tasks }: Props) {
  if (tasks.length === 0) {
    return <EmptyState title="Sem tarefas" />;
  }

  return (
    <>
      {tasks.map((task, idx) => (
        <View key={`task-${task.id}-${idx}`} style={cardStyles.card}>
          <View style={cardStyles.row}>
            <Text style={[cardStyles.cardTitle, { flex: 1 }]}>{task.title}</Text>
            {task.done ? (
              <Text style={styles.done}>Feita</Text>
            ) : (
              <Text style={styles.pending}>Pendente</Text>
            )}
          </View>
          <Text style={cardStyles.cardMeta}>
            {formatPtDate(task.dueDateIso)}
            {task.dueTime ? ` · ${task.dueTime}` : ""}
            {task.type === "grupo" ? " · Grupo" : " · Individual"}
          </Text>
          {task.description ? (
            <Text style={cardStyles.cardMeta}>{task.description}</Text>
          ) : null}
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  done: { color: brand.success, fontWeight: "700", fontSize: 12 },
  pending: { color: brand.gold, fontWeight: "700", fontSize: 12 },
});
