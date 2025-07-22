import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '@/services/eventService';
import { getCalendars, createCalendar } from '@/services/calendarService';
import type { CalendarEvent, Calendar as CalendarType } from '@/types/calendar';

export const useCalendarData = (userId: string) => {
  const queryClient = useQueryClient();
  const [selectedCalendar, setSelectedCalendar] = useState<CalendarType | null>(
    null
  );

  // 캘린더 목록 조회
  const {
    data: calendars,
    isLoading: isLoadingCalendars,
    error: calendarsError,
  } = useQuery({
    queryKey: ['calendars', userId],
    queryFn: getCalendars,
    enabled: !!userId,
  });

  // 캘린더 데이터가 로드되면 selectedCalendar를 자동으로 설정
  useEffect(() => {
    if (calendars && calendars.length > 0 && !selectedCalendar) {
      setSelectedCalendar(calendars[0]);
    }
  }, [calendars, selectedCalendar]);

  // 이벤트 조회 (선택된 캘린더가 있을 때만)
  const {
    data: events,
    isLoading: isLoadingEvents,
    error: eventsError,
  } = useQuery({
    queryKey: ['events', selectedCalendar?.id],
    queryFn: () =>
      selectedCalendar ? getEvents(selectedCalendar.id) : Promise.resolve([]),
    enabled: !!selectedCalendar,
    // suspense: false, // 필요시 활성화
  });

  // 캘린더 생성
  const createCalendarMutation = useMutation({
    mutationFn: (name: string) => createCalendar(name),
    onSuccess: (newCalendar) => {
      queryClient.invalidateQueries({ queryKey: ['calendars', userId] });
      setSelectedCalendar(newCalendar);
    },
  });

  // 이벤트 생성/수정
  const saveEventMutation = useMutation({
    mutationFn: (
      eventData:
        | CalendarEvent
        | Omit<CalendarEvent, 'id' | 'created_by' | 'created_at' | 'updated_at'>
    ) => {
      if (!selectedCalendar) throw new Error('No calendar selected');
      if (!('id' in eventData) || !eventData.id) {
        const newEventData = { ...eventData };
        return createEvent(
          newEventData as Omit<
            CalendarEvent,
            'id' | 'created_by' | 'created_at' | 'updated_at'
          >
        );
      } else {
        return updateEvent(eventData as CalendarEvent);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['events', selectedCalendar?.id],
      });
    },
  });

  // 이벤트 삭제
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['events', selectedCalendar?.id],
      });
    },
  });

  // 통합 로딩/에러 상태
  const overallIsLoading =
    isLoadingCalendars || (!!selectedCalendar && isLoadingEvents);
  const overallError = calendarsError || eventsError;

  return {
    events: events ?? [],
    calendars: calendars ?? [],
    selectedCalendar,
    setSelectedCalendar,
    isLoading: overallIsLoading,
    error: overallError,
    handleCreateCalendar: createCalendarMutation.mutateAsync,
    handleSaveEvent: saveEventMutation.mutateAsync,
    handleDeleteEvent: deleteEventMutation.mutateAsync,
  };
};
