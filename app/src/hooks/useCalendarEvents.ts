"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiClientError,
  createCalendarEvent as apiCreateCalendarEvent,
  getCalendar,
  patchCalendarEvent as apiPatchCalendarEvent,
} from "@/lib/api/client";
import { invalidateTaskSyncQueries } from "@/lib/query/invalidate-task-sync";
import { queryKeys } from "@/lib/query/keys";
import type {
  CalendarResponse,
  CreateCalendarEventBody,
  ManualCalendarEventInput,
} from "@/lib/types/calendar-api";

function toCreateBody(event: ManualCalendarEventInput): CreateCalendarEventBody {
  return {
    title: event.title,
    description: event.description,
    type: event.type,
    date: event.date,
    dateEnd: event.dateEnd,
    timeStart: event.timeStart,
    timeEnd: event.timeEnd,
    recurrence: event.recurrence,
    recurrenceUntil: event.recurrenceUntil,
    recurrenceDays: event.recurrenceDays,
    subjectCode: event.subjectCode,
    color: event.colorOverride ? event.color : undefined,
  };
}

function canToggleEvent(id: string): boolean {
  return !id.startsWith("academico-");
}

export function useCalendarEvents() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.calendar(),
    queryFn: getCalendar,
  });

  const events = query.data?.events ?? [];
  const academicDates = query.data?.academicDates ?? [];
  const academicDateGroups = query.data?.academicDateGroups ?? [];

  const toggleMutation = useMutation({
    mutationFn: ({
      id,
      done,
    }: {
      id: string;
      done: boolean;
      subjectCode?: string;
    }) => apiPatchCalendarEvent(id, { action: "toggle", done }),
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.calendar() });
      const previous = queryClient.getQueryData<CalendarResponse>(
        queryKeys.calendar()
      );
      if (previous) {
        queryClient.setQueryData<CalendarResponse>(queryKeys.calendar(), {
          ...previous,
          events: previous.events.map((event) =>
            event.id === id ? { ...event, done } : event
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.calendar(), context.previous);
      }
    },
    onSettled: (_data, _error, variables) => {
      invalidateTaskSyncQueries(queryClient, {
        subjectCode: variables.subjectCode,
      });
    },
  });

  const addMutation = useMutation({
    mutationFn: (body: CreateCalendarEventBody) => apiCreateCalendarEvent(body),
    onSuccess: () => {
      void invalidateTaskSyncQueries(queryClient);
      void queryClient.invalidateQueries({ queryKey: queryKeys.calendar() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiPatchCalendarEvent(id, { action: "delete" }),
    onSuccess: () => {
      void invalidateTaskSyncQueries(queryClient);
      void queryClient.invalidateQueries({ queryKey: queryKeys.calendar() });
    },
  });

  const toggleDone = (id: string) => {
    if (!canToggleEvent(id)) return;
    const event = events.find((item) => item.id === id);
    if (!event) return;
    toggleMutation.mutate({
      id,
      done: !event.done,
      subjectCode: event.subjectCode,
    });
  };

  const deleteEvent = (id: string) => {
    const event = events.find((item) => item.id === id);
    if (!event) return;
    const confirmed = window.confirm(
      `Excluir “${event.title}”? Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;
    deleteMutation.mutate(id);
  };

  const addManualEvent = (event: ManualCalendarEventInput): void => {
    addMutation.mutate(toCreateBody(event));
  };

  const errorMessage =
    query.error instanceof ApiClientError
      ? query.error.message
      : query.error
        ? "Não foi possível carregar o calendário."
        : addMutation.error instanceof ApiClientError
          ? addMutation.error.message
          : toggleMutation.error instanceof ApiClientError
            ? toggleMutation.error.message
            : deleteMutation.error instanceof ApiClientError
              ? deleteMutation.error.message
              : null;

  return {
    events,
    academicDates,
    academicDateGroups,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isAdding: addMutation.isPending,
    isToggling: toggleMutation.isPending,
    isDeleting: deleteMutation.isPending,
    error: errorMessage,
    hydrated: !query.isLoading,
    toggleDone,
    deleteEvent,
    addManualEvent,
    refetch: query.refetch,
  };
}
