import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEvent, updateEvent, deleteEvent } from '@/services/eventService';
import type { CalendarEvent } from '@/types/calendar';
import { ensureIsoString } from '@/lib/date-utils';

interface OptimisticContext {
  previousEvents?: CalendarEvent[];
  calendarId: string;
}

/**
 * optimistic update를 사용한 이벤트 mutation 관리 Hook
 */
export function useEventMutations(userId: string) {
  const queryClient = useQueryClient();

  // 이벤트 날짜 정규화
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

  // 이벤트 생성 mutation
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

      // 진행 중인 refetch 취소
      await queryClient.cancelQueries({ queryKey: ['events', calendarId] });

      // 이전 값 스냅샷
      const previousEvents = queryClient.getQueryData<CalendarEvent[]>([
        'events',
        calendarId,
      ]);

      // Optimistic update 수행
      if (previousEvents) {
        const optimisticEvent: CalendarEvent = {
          ...normalizeEventDates(newEvent),
          id: `temp-${Date.now()}`, // 임시 ID
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
      // 에러 발생 시 롤백
      if (context?.previousEvents) {
        queryClient.setQueryData(
          ['events', context.calendarId],
          context.previousEvents
        );
      }
    },
    onSettled: (data, error, variables) => {
      // 에러나 성공 후 항상 refetch
      queryClient.invalidateQueries({
        queryKey: ['events', variables.calendar_id],
      });
    },
  });

  // 이벤트 수정 mutation
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
      const calendarId = updatedEvent.calendar_id;

      await queryClient.cancelQueries({ queryKey: ['events', calendarId] });

      const previousEvents = queryClient.getQueryData<CalendarEvent[]>([
        'events',
        calendarId,
      ]);

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
        queryClient.setQueryData(
          ['events', context.calendarId],
          context.previousEvents
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['events', variables.calendar_id],
      });
    },
  });

  // 이벤트 삭제 mutation
  const deleteMutation = useMutation<
    void,
    Error,
    { eventId: string; calendarId: string },
    OptimisticContext
  >({
    mutationFn: ({ eventId }) => deleteEvent(eventId, userId),
    onMutate: async ({ eventId, calendarId }) => {
      await queryClient.cancelQueries({ queryKey: ['events', calendarId] });

      const previousEvents = queryClient.getQueryData<CalendarEvent[]>([
        'events',
        calendarId,
      ]);

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
        queryClient.setQueryData(
          ['events', context.calendarId],
          context.previousEvents
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['events', variables.calendarId],
      });
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
