import { useQuery } from '@tanstack/react-query';
import { getEventsByCalendars } from '@/services/eventService';
import type { CalendarEvent } from '@/types/calendar';
import { useMemo } from 'react';
import { useEventRealtimeSync } from './useEventRealtimeSync';

const REALTIME_DEBOUNCE_MS = 300;
const QUERY_STALE_TIME_MS = 10 * 60 * 1000; // 10 minutes
const QUERY_GC_TIME_MS = 30 * 60 * 1000; // 30 minutes

export function useEventsByCalendars(selectedCalendarIds: string[]) {
  const { isSubscribed } = useEventRealtimeSync({
    selectedCalendarIds,
    enabled: selectedCalendarIds.length > 0,
    debounceMs: REALTIME_DEBOUNCE_MS,
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['events', 'multiple', [...selectedCalendarIds].sort().join(',')],
    queryFn: () => getEventsByCalendars(selectedCalendarIds),
    enabled: selectedCalendarIds.length > 0,
    staleTime: QUERY_STALE_TIME_MS,
    gcTime: QUERY_GC_TIME_MS,
    placeholderData: (previousData) => previousData,
  });

  const eventsByCalendar = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};

    selectedCalendarIds.forEach((id) => {
      grouped[id] = [];
    });

    (data || []).forEach((event) => {
      event.calendar_ids?.forEach((calendarId) => {
        if (grouped[calendarId]) {
          grouped[calendarId].push(event);
        }
      });
    });

    return grouped;
  }, [data, selectedCalendarIds]);

  return {
    events: data || [],
    eventsByCalendar,
    isLoading,
    isError,
    errors: error ? [error] : [],
    refetch,
    isRealtimeConnected: isSubscribed,
  };
}
