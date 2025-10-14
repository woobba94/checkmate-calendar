import { useQuery } from '@tanstack/react-query';
import { getEventsByCalendars } from '@/services/eventService';
import type { CalendarEvent } from '@/types/calendar';
import { useMemo } from 'react';

/**
 * 여러 캘린더에서 이벤트를 가져와 병합하는 Hook
 * Junction Table 사용으로 한 번의 쿼리로 모든 이벤트 조회 (중복 제거됨)
 */
export function useEventsByCalendars(selectedCalendarIds: string[]) {
  // 여러 캘린더의 이벤트를 한 번에 조회 (중복 자동 제거)
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['events', 'multiple', selectedCalendarIds.sort().join(',')],
    queryFn: () => getEventsByCalendars(selectedCalendarIds),
    enabled: selectedCalendarIds.length > 0,
    staleTime: 10 * 60 * 1000, // 10분간 데이터를 fresh로 간주
    gcTime: 30 * 60 * 1000, // 30분간 캐시 유지
    placeholderData: (previousData) => previousData, // 이전 데이터 유지하여 깜빡임 방지
  });

  // 캘린더별 이벤트 그룹화
  const eventsByCalendar = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};

    // 각 캘린더 ID로 초기화
    selectedCalendarIds.forEach((id) => {
      grouped[id] = [];
    });

    // 이벤트를 해당 캘린더들에 할당
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
  };
}
