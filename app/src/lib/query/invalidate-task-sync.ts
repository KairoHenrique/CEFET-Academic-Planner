import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";

export interface TaskSyncInvalidationOptions {
  subjectCode?: string;
}

export function invalidateTaskSyncQueries(
  queryClient: QueryClient,
  options: TaskSyncInvalidationOptions = {}
): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.calendar() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });

  if (options.subjectCode) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.disciplina(options.subjectCode),
    });
  } else {
    void queryClient.invalidateQueries({
      queryKey: [...queryKeys.all, "disciplina"],
    });
  }

  void queryClient.invalidateQueries({ queryKey: [...queryKeys.all, "disciplinas"] });
  void queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
}
