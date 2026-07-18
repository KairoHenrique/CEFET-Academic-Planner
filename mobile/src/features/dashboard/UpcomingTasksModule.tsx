import { Text, View } from "react-native";
import type { AcademicTask } from "@acme/api-contracts";
import { cardStyles, formatPtDate } from "../../ui/cards";
import { EmptyState } from "../../ui/EmptyState";

type Props = { tasks: AcademicTask[] };

export function UpcomingTasksModule({ tasks }: Props) {
  const pending = tasks.filter((t) => !t.done).slice(0, 8);

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
            <Text style={cardStyles.cardTitle}>{task.title}</Text>
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
