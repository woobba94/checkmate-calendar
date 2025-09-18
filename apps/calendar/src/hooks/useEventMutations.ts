import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEvent, updateEvent, deleteEvent } from '@/services/eventService';
import type { CalendarEvent } from '@/types/calendar';
import { ensureIsoString } from '@/lib/date-utils';

interface OptimisticContext {
  previousEvents?: CalendarEvent[];
  calendarId: string;
}

/**
 * Hook for managing event mutations with optimistic updates
 */
export function useEventMutations(userId: string) {
  const queryClient = useQueryClient();

  // Normalize event dates
  const normalizeEventDates = (event: any): any => {
    const normalized = { ...event };
    if (normalized.start) {
      normalized.start = ensureIsoString(normalized.start);
    }
    if (normalized.end) {
      normalized.end = ensureIsoString(normalized.end);
    }
    return normalized;
  };

  // Create event mutation
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
      const calendarId = newEvent.calendar_id;
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['events', calendarId] });

      // Snapshot previous value
      const previousEvents = queryClient.getQueryData<CalendarEvent[]>(['events', calendarId]);

      // Optimistically update
      if (previousEvents) {
        const optimisticEvent: CalendarEvent = {
          ...normalizeEventDates(newEvent),
          id: `temp-${Date.now()}`, // Temporary ID
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData<CalendarEvent[]>(
          ['events', calendarId],
          [...previousEvents, optimisticEvent]
        );
      }

      return { previousEvents, calendarId };
    },
    onError: (err, newEvent, context) => {
      // Rollback on error
      if (context?.previousEvents) {
        queryClient.setQueryData(['events', context.calendarId], context.previousEvents);
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['events', variables.calendar_id] });
    },
  });

  // Update event mutation
  const updateMutation = useMutation<CalendarEvent, Error, CalendarEvent, OptimisticContext>({
    mutationFn: async (eventData) => {
      const normalized = normalizeEventDates(eventData);
      return updateEvent(normalized, userId);
    },
    onMutate: async (updatedEvent) => {
      const calendarId = updatedEvent.calendar_id;
      
      await queryClient.cancelQueries({ queryKey: ['events', calendarId] });

      const previousEvents = queryClient.getQueryData<CalendarEvent[]>(['events', calendarId]);

      if (previousEvents) {
        const normalized = normalizeEventDates(updatedEvent);
        queryClient.setQueryData<CalendarEvent[]>(
          ['events', calendarId],
          previousEvents.map((event) =>
            event.id === updatedEvent.id ? { ...event, ...normalized } : event
          )
        );
      }

      return { previousEvents, calendarId };
    },
    onError: (err, updatedEvent, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(['events', context.calendarId], context.previousEvents);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events', variables.calendar_id] });
    },
  });

  // Delete event mutation
  const deleteMutation = useMutation<
    void,
    Error,
    { eventId: string; calendarId: string },
    OptimisticContext
  >({
    mutationFn: ({ eventId }) => deleteEvent(eventId, userId),
    onMutate: async ({ eventId, calendarId }) => {
      await queryClient.cancelQueries({ queryKey: ['events', calendarId] });

      const previousEvents = queryClient.getQueryData<CalendarEvent[]>(['events', calendarId]);

      if (previousEvents) {
        queryClient.setQueryData<CalendarEvent[]>(
          ['events', calendarId],
          previousEvents.filter((event) => event.id !== eventId)
        );
      }

      return { previousEvents, calendarId };
    },
    onError: (err, variables, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(['events', context.calendarId], context.previousEvents);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events', variables.calendarId] });
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
