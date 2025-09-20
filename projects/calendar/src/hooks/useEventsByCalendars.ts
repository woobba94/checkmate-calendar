import { useQueries } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { getEvents } from '@/services/eventService';
import type { CalendarEvent } from '@/types/calendar';
import { useMemo } from 'react';

/**
 * 여러 캘린더에서 이벤트를 가져와 병합하는 Hook
 */
export function useEventsByCalendars(selectedCalendarIds: string[]) {
  // 각 캘린더에 대한 query 생성
  const queries = useQueries({
    queries: selectedCalendarIds.map((calendarId) => ({
      queryKey: ['events', calendarId],
      queryFn: () => getEvents(calendarId),
      enabled: !!calendarId,
      staleTime: 5 * 60 * 1000, // 5분간 데이터를 fresh로 간주
    })),
  });

  // 병합된 결과 계산
  const mergedData = useMemo(() => {
    const allEvents: CalendarEvent[] = [];
    const eventsByCalendar: Record<string, CalendarEvent[]> = {};

    queries.forEach((query, index) => {
      const calendarId = selectedCalendarIds[index];
      const events = query.data || [];

      eventsByCalendar[calendarId] = events;
      allEvents.push(...events);
    });

    return {
      events: allEvents,
      eventsByCalendar,
    };
  }, [queries, selectedCalendarIds]);

  // 전체 loading/error 상태 계산
  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);
  const errors = queries
    .filter(
      (q): q is UseQueryResult<CalendarEvent[], Error> => q.isError && !!q.error
    )
    .map((q) => q.error);

  return {
    events: mergedData.events,
    eventsByCalendar: mergedData.eventsByCalendar,
    isLoading,
    isError,
    errors,
    refetch: () => Promise.all(queries.map((q) => q.refetch())),
  };
}
