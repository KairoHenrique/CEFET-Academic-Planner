"use client";

import { PlannerSelect } from "@/components/ui/PlannerSelect";
import {
  TASK_SORT_LABELS,
  TASK_SORT_MODES,
  type TaskSortMode,
} from "@/lib/types/priority";

const SORT_OPTIONS = TASK_SORT_MODES.map((mode) => ({
  value: mode,
  label: TASK_SORT_LABELS[mode],
}));

interface TaskSortSelectProps {
  mode: TaskSortMode;
  onChange: (mode: TaskSortMode) => void;
}

export function TaskSortSelect({ mode, onChange }: TaskSortSelectProps) {
  return (
    <PlannerSelect
      label="Ordenar"
      value={mode}
      options={SORT_OPTIONS}
      onChange={onChange}
      className="task-sort-select"
    />
  );
}
