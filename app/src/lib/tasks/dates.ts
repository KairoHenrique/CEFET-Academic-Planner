import type { AcademicTask } from "@/lib/types/task";

export function parseBrDateToIso(date: string): string {
  const [day, month, year] = date.split("/").map(Number);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatIsoToBr(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function normalizeTime(value: string | null | undefined): string {
  if (!value?.trim()) return "23:59";
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  return "23:59";
}

export function getTaskDueDateTime(
  dueDateIso: string,
  dueTime = "23:59"
): Date {
  const [year, month, day] = dueDateIso.split("-").map(Number);
  const [hours, minutes] = normalizeTime(dueTime).split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function formatTaskDueLabel(dateBr: string, dueTime?: string): string {
  const time = normalizeTime(dueTime);
  return `${dateBr} · ${time}`;
}

const DASHBOARD_HIDE_DAYS_AFTER_DUE = 3;

export function shouldHideTaskFromDashboard(
  task: AcademicTask,
  now = new Date()
): boolean {
  if (!task.dueDateIso) return false;

  const due = getTaskDueDateTime(task.dueDateIso, task.dueTime);
  const hideAfter = new Date(due);
  hideAfter.setDate(hideAfter.getDate() + DASHBOARD_HIDE_DAYS_AFTER_DUE);
  hideAfter.setHours(23, 59, 59, 999);

  return now > hideAfter;
}

/** Prazo de entrega já passou — não importar do SIGAA no sync. */
export function isAtividadePrazoVencido(
  dataFim: string,
  horaFim: string | null | undefined,
  now = new Date()
): boolean {
  if (!dataFim.trim()) return false;
  const due = getTaskDueDateTime(dataFim, horaFim ?? "23:59");
  return now > due;
}

export type TaskDueFilter = "todas" | "semana" | "mes" | "atrasadas" | "concluidas";

export function matchesTaskDueFilter(
  task: AcademicTask,
  filter: TaskDueFilter,
  now = new Date()
): boolean {
  if (filter === "concluidas") return task.done;
  if (filter === "todas") return true;
  if (!task.dueDateIso) return filter !== "atrasadas";

  const due = getTaskDueDateTime(task.dueDateIso, task.dueTime);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filter === "atrasadas") {
    return !task.done && due < now;
  }

  if (filter === "semana") {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);
    return due >= today && due <= weekEnd;
  }

  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
  return due >= today && due <= monthEnd;
}
