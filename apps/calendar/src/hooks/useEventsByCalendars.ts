import { useQueries, UseQueryResult } from '@tanstack/react-query';
import { getEvents } from '@/services/eventService';
import type { CalendarEvent } from '@/types/calendar';
import { useMemo } from 'react';

/**
 * Hook for fetching and merging events from multiple calendars
 */
export function useEventsByCalendars(selectedCalendarIds: string[]) {
  // Create queries for each calendar
  const queries = useQueries({
    queries: selectedCalendarIds.map((calendarId) => ({
      queryKey: ['events', calendarId],
      queryFn: () => getEvents(calendarId),
      enabled: !!calendarId,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    })),
  });

  // Compute merged results
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

  // Compute overall loading/error states
  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);
  const errors = queries
    .filter((q): q is UseQueryResult<CalendarEvent[], Error> => q.isError && !!q.error)
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
