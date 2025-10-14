import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEvent, updateEvent, deleteEvent } from '@/services/eventService';
import type { CalendarEvent } from '@/types/calendar';
import { ensureIsoString } from '@/lib/date-utils';

interface OptimisticContext {
  previousData: Record<string, CalendarEvent[]>;
  calendarIds: string[];
}

/**
 * Optimistic update를 사용한 이벤트 mutation 관리 Hook
 * - 이벤트 생성, 수정, 삭제 시 즉각적인 UI 업데이트 제공
 * - 에러 발생 시 자동 롤백
 * - 여러 캘린더에 걸친 이벤트 동기화 처리
 */
export function useEventMutations(userId: string) {
  const queryClient = useQueryClient();

  // 이벤트 날짜 정규화 (ISO 문자열로 변환)
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
      // 여러 캘린더에 대해 optimistic update
      const affectedCalendarIds = newEvent.calendar_ids || [];
      const previousData: Record<string, CalendarEvent[]> = {};

      // 각 캘린더에 대해 처리
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
            id: `temp-${Date.now()}`,
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

      return { previousData, calendarIds: affectedCalendarIds };
    },
    onError: (_err, _newEvent, context) => {
      // 에러 발생 시 이전 상태로 롤백
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
    onSettled: (_data, _error, variables) => {
      // 서버와 동기화 (optimistic update의 정확성 보장)
      // 모든 이벤트 쿼리 무효화 (단일 캘린더 + 다중 캘린더 모두)
      queryClient.invalidateQueries({
        queryKey: ['events'],
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
      // 여러 캘린더에 대해 optimistic update
      const affectedCalendarIds = updatedEvent.calendar_ids || [];
      const previousData: Record<string, CalendarEvent[]> = {};

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
      // 에러 발생 시 이전 상태로 롤백
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
    onSettled: (_data, _error, variables) => {
      // 서버와 동기화
      // 모든 이벤트 쿼리 무효화 (단일 캘린더 + 다중 캘린더 모두)
      queryClient.invalidateQueries({
        queryKey: ['events'],
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
      // 에러 발생 시 이전 상태로 롤백
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
    onSettled: (_data, _error, variables) => {
      // 서버와 동기화
      // 모든 이벤트 쿼리 무효화 (단일 캘린더 + 다중 캘린더 모두)
      queryClient.invalidateQueries({
        queryKey: ['events'],
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
