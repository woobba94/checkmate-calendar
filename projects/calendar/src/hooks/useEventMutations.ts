import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEvent, updateEvent, deleteEvent } from '@/services/eventService';
import type { CalendarEvent } from '@/types/calendar';
import { ensureIsoString } from '@/lib/date-utils';
import { useEventRealtimeSyncContext } from '@/contexts/EventRealtimeSyncContext';

interface OptimisticContext {
  previousData: Record<string, CalendarEvent[]>;
  calendarIds: string[];
}

export function useEventMutations(userId: string) {
  const queryClient = useQueryClient();
  const { recordOptimisticUpdate } = useEventRealtimeSyncContext();

  const normalizeEventDates = <
    T extends { start?: string | Date; end?: string | Date },
  >(
    event: T
  ): T => {
    const normalized = { ...event };
    if (normalized.start) {
      normalized.start = ensureIsoString(normalized.start) as T['start'];
    }
    if (normalized.end) {
      normalized.end = ensureIsoString(normalized.end) as T['end'];
    }
    return normalized;
  };
  const createMutation = useMutation<
    CalendarEvent,
    Error,
    Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>,
    OptimisticContext
  >({
    mutationFn: async (eventData) => {
      const normalized = normalizeEventDates(eventData);
      return createEvent(normalized, userId);
    },
    onMutate: async (newEvent) => {
      const affectedCalendarIds = newEvent.calendar_ids || [];
      const previousData: Record<string, CalendarEvent[]> = {};
      const tempId = `temp-${Date.now()}`;

      for (const calendarId of affectedCalendarIds) {
        await queryClient.cancelQueries({ queryKey: ['events', calendarId] });

        const events = queryClient.getQueryData<CalendarEvent[]>([
          'events',
          calendarId,
        ]);

        if (events) {
          previousData[calendarId] = events;

          const optimisticEvent: CalendarEvent = {
            ...normalizeEventDates(newEvent),
            id: tempId,
            calendar_ids: affectedCalendarIds,
            created_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          queryClient.setQueryData<CalendarEvent[]>(
            ['events', calendarId],
            [...events, optimisticEvent]
          );
        }
      }

      recordOptimisticUpdate(tempId);
      return { previousData, calendarIds: affectedCalendarIds };
    },
    onError: (_err, _newEvent, context) => {
      if (context) {
        context.calendarIds.forEach((calendarId) => {
          if (context.previousData[calendarId]) {
            queryClient.setQueryData(
              ['events', calendarId],
              context.previousData[calendarId]
            );
          }
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
  const updateMutation = useMutation<
    CalendarEvent,
    Error,
    CalendarEvent,
    OptimisticContext
  >({
    mutationFn: async (eventData) => {
      const normalized = normalizeEventDates(eventData);
      return updateEvent(normalized, userId);
    },
    onMutate: async (updatedEvent) => {
      const affectedCalendarIds = updatedEvent.calendar_ids || [];
      const previousData: Record<string, CalendarEvent[]> = {};

      recordOptimisticUpdate(updatedEvent.id);

      for (const calendarId of affectedCalendarIds) {
        await queryClient.cancelQueries({ queryKey: ['events', calendarId] });

        const events = queryClient.getQueryData<CalendarEvent[]>([
          'events',
          calendarId,
        ]);

        if (events) {
          previousData[calendarId] = events;
          const normalized = normalizeEventDates(updatedEvent);
          queryClient.setQueryData<CalendarEvent[]>(
            ['events', calendarId],
            events.map((event) =>
              event.id === updatedEvent.id ? { ...event, ...normalized } : event
            )
          );
        }
      }

      return { previousData, calendarIds: affectedCalendarIds };
    },
    onError: (_err, _updatedEvent, context) => {
      if (context) {
        context.calendarIds.forEach((calendarId) => {
          if (context.previousData[calendarId]) {
            queryClient.setQueryData(
              ['events', calendarId],
              context.previousData[calendarId]
            );
          }
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
  const deleteMutation = useMutation<
    void,
    Error,
    { eventId: string; calendarId: string },
    OptimisticContext
  >({
    mutationFn: ({ eventId }) => deleteEvent(eventId, userId),
    onMutate: async ({ eventId, calendarId }) => {
      recordOptimisticUpdate(eventId);
      await queryClient.cancelQueries({ queryKey: ['events', calendarId] });

      const previousEvents = queryClient.getQueryData<CalendarEvent[]>([
        'events',
        calendarId,
      ]);

      const previousData: Record<string, CalendarEvent[]> = {};
      if (previousEvents) {
        previousData[calendarId] = previousEvents;
        queryClient.setQueryData<CalendarEvent[]>(
          ['events', calendarId],
          previousEvents.filter((event) => event.id !== eventId)
        );
      }

      return { previousData, calendarIds: [calendarId] };
    },
    onError: (_err, _variables, context) => {
      if (context) {
        context.calendarIds.forEach((calendarId) => {
          if (context.previousData[calendarId]) {
            queryClient.setQueryData(
              ['events', calendarId],
              context.previousData[calendarId]
            );
          }
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  return {
    createEvent: createMutation.mutateAsync,
    updateEvent: updateMutation.mutateAsync,
    deleteEvent: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
