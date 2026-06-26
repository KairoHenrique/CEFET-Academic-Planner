import type { PriorityLevel, TaskSortMode } from "@/lib/types/priority";
import { PRIORITY_RANK } from "@/lib/types/priority";
import type { AcademicTask } from "@/lib/types/task";

interface NamedItem {
  name: string;
  code: string;
}

export function comparePriority(
  a: PriorityLevel,
  b: PriorityLevel
): number {
  return PRIORITY_RANK[b] - PRIORITY_RANK[a];
}

export function sortSubjectsByPriority<T extends NamedItem>(
  items: T[],
  getPriority: (code: string) => PriorityLevel
): T[] {
  return [...items].sort((a, b) => {
    const byPriority = comparePriority(
      getPriority(a.code),
      getPriority(b.code)
    );
    if (byPriority !== 0) return byPriority;
    return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
  });
}

function taskDeadlineValue(task: AcademicTask): number {
  const time = task.dueTime?.padStart(5, "0") ?? "23:59";
  return new Date(`${task.dueDateIso}T${time}`).getTime();
}

export function sortTasks<T extends AcademicTask>(
  tasks: T[],
  getPriority: (taskId: number) => PriorityLevel,
  mode: TaskSortMode
): T[] {
  return [...tasks].sort((a, b) => {
    const deadlineDiff = taskDeadlineValue(a) - taskDeadlineValue(b);
    const priorityDiff = comparePriority(
      getPriority(a.id),
      getPriority(b.id)
    );

    switch (mode) {
      case "priority_deadline":
        return priorityDiff !== 0 ? priorityDiff : deadlineDiff;
      case "deadline":
        return deadlineDiff;
      case "priority":
        return priorityDiff !== 0
          ? priorityDiff
          : a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" });
      case "deadline_priority":
      default:
        return deadlineDiff !== 0 ? deadlineDiff : priorityDiff;
    }
  });
}
