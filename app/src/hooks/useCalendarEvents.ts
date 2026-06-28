"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiClientError,
  createCalendarEvent as apiCreateCalendarEvent,
  getCalendar,
  patchCalendarEvent as apiPatchCalendarEvent,
} from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { CalendarEvent } from "@/lib/types/calendar";
import type {
  CalendarResponse,
  CreateCalendarEventBody,
} from "@/lib/types/calendar-api";

function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return a.title.localeCompare(b.title, "pt-BR");
  });
}

function toCreateBody(
  event: Omit<CalendarEvent, "id" | "manual">
): CreateCalendarEventBody {
  return {
    title: event.title,
    description: event.description,
    type: event.type,
    date: event.date,
    subjectCode: event.subjectCode,
    color: event.color,
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

  const toggleMutation = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      apiPatchCalendarEvent(id, { action: "toggle", done }),
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
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.calendar() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.disciplinas() });
    },
  });

  const addMutation = useMutation({
    mutationFn: (body: CreateCalendarEventBody) => apiCreateCalendarEvent(body),
    onSuccess: (created) => {
      queryClient.setQueryData<CalendarResponse>(
        queryKeys.calendar(),
        (current) => {
          if (!current) return current;
          return {
            ...current,
            events: sortEvents([...current.events, created]),
          };
        }
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.disciplinas() });
    },
  });

  const toggleDone = (id: string) => {
    if (!canToggleEvent(id)) return;
    const event = events.find((item) => item.id === id);
    if (!event) return;
    toggleMutation.mutate({ id, done: !event.done });
  };

  const addManualEvent = (
    event: Omit<CalendarEvent, "id" | "manual">
  ): void => {
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
            : null;

  return {
    events,
    academicDates,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isAdding: addMutation.isPending,
    isToggling: toggleMutation.isPending,
    error: errorMessage,
    hydrated: !query.isLoading,
    toggleDone,
    addManualEvent,
    refetch: query.refetch,
  };
}
